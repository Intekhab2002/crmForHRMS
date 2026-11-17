import { getQueryExecutor } from "../../../database/queryExecutor.js";

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function isAtOrBefore(value, cutoffTime) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time <= cutoffTime;
}

export async function fetchSeverityPerformance(
  runs,
  breachEpisodes = [],
  dataCutoff = new Date().toISOString(),
  tx = null,
) {
  if (!runs.length) return [];

  const cutoffTime = new Date(dataCutoff).getTime();

  if (!Number.isFinite(cutoffTime)) {
    throw new TypeError("Invalid report dataCutoff.");
  }

  const ticketIds = [...new Set(runs.map((run) => run.ticket_id))];

  const result = await getQueryExecutor(tx).query(
    `
      SELECT
        seg.id AS segment_id,
        seg.ticket_sla_id,
        ts.ticket_id,
        seg.run_number,
        seg.duration_value_key,
        seg.target_minutes,
        seg.consumed_business_seconds,
        seg.consumed_minutes,
        seg.started_at,
        seg.ended_at,
        seg.status
      FROM ticket_sla_segments seg
      JOIN ticket_sla ts
        ON ts.id = seg.ticket_sla_id
      WHERE ts.ticket_id = ANY($1::uuid[])
        AND seg.started_at <= $2::timestamptz
      ORDER BY
        ts.ticket_id,
        seg.run_number,
        seg.started_at,
        seg.id
    `,
    [ticketIds, dataCutoff],
  );

  const runByKey = new Map(
    runs.map((run) => [`${run.ticket_id}:${run.run_number}`, run]),
  );

  const segmentsByRun = new Map();

  for (const segment of result.rows) {
    const key = `${segment.ticket_id}:${segment.run_number}`;

    if (!runByKey.has(key)) continue;

    const list = segmentsByRun.get(key) || [];
    list.push(segment);
    segmentsByRun.set(key, list);
  }

  const episodesBySegment = new Map();

  for (const episode of breachEpisodes) {
    if (!isAtOrBefore(episode.breached_at, cutoffTime)) continue;
    if (!episode.segment_id) continue;

    const list = episodesBySegment.get(episode.segment_id) || [];
    list.push(episode);
    episodesBySegment.set(episode.segment_id, list);
  }

  const groups = new Map();

  function getGroup(severity) {
    if (!groups.has(severity)) {
      groups.set(severity, {
        severity,
        runs: new Set(),
        metRuns: new Set(),
        breachedRuns: new Set(),
        breachEpisodes: 0,
        activeBreachEpisodes: 0,
        clearedBreachEpisodes: 0,
        targets: [],
        consumed: [],
      });
    }

    return groups.get(severity);
  }

  for (const [runKey, runSegments] of segmentsByRun) {
    const run = runByKey.get(runKey);
    if (!run) continue;

    const applicableSegments = runSegments.filter((segment) =>
      isAtOrBefore(segment.started_at, cutoffTime),
    );

    if (!applicableSegments.length) continue;

    const effectiveSegment = applicableSegments.at(-1);
    const effectiveSeverity = effectiveSegment.duration_value_key || "UNKNOWN";

    // Run-level metrics: count each run in only one severity group.
    const runGroup = getGroup(effectiveSeverity);
    runGroup.runs.add(runKey);

    const effectiveTarget = Number(effectiveSegment.target_minutes);

    if (Number.isFinite(effectiveTarget) && effectiveTarget > 0) {
      runGroup.targets.push(effectiveTarget);
    }

    const effectiveConsumedSeconds =
      effectiveSegment.consumed_business_seconds ??
      Number(effectiveSegment.consumed_minutes || 0) * 60;

    if (Number.isFinite(Number(effectiveConsumedSeconds))) {
      runGroup.consumed.push(Number(effectiveConsumedSeconds) / 60);
    }

    const runHasBreach = applicableSegments.some(
      (segment) => (episodesBySegment.get(segment.segment_id) || []).length > 0,
    );

    if (runHasBreach) {
      runGroup.breachedRuns.add(runKey);
    } else if (
      ["COMPLETED", "STOPPED"].includes(run.status) &&
      Number(run.target_resolution_minutes) > 0 &&
      Number(run.elapsed_business_minutes) <=
        Number(run.target_resolution_minutes)
    ) {
      runGroup.metRuns.add(runKey);
    }

    // Episode-level metrics: attribute each episode to the
    // severity of the segment referenced by that episode.
    for (const segment of applicableSegments) {
      const segmentEpisodes = episodesBySegment.get(segment.segment_id) || [];

      if (!segmentEpisodes.length) continue;

      const episodeGroup = getGroup(segment.duration_value_key || "UNKNOWN");

      for (const episode of segmentEpisodes) {
        episodeGroup.breachEpisodes += 1;

        const clearedAt = episode.cleared_at
          ? new Date(episode.cleared_at).getTime()
          : null;

        const clearedAtCutoff =
          clearedAt != null &&
          Number.isFinite(clearedAt) &&
          clearedAt <= cutoffTime;

        if (clearedAtCutoff) {
          episodeGroup.clearedBreachEpisodes += 1;
        } else {
          episodeGroup.activeBreachEpisodes += 1;
        }
      }
    }
  }

  return [...groups.values()].map((group) => {
    const met = group.metRuns.size;
    const breached = group.breachedRuns.size;
    const denominator = met + breached;

    return {
      severity: group.severity,
      runs: group.runs.size,
      met,
      breached,
      metRuns: met,
      breachedRuns: breached,

      compliance: denominator ? (met / denominator) * 100 : null,

      averageTarget: average(group.targets),
      averageConsumed: average(group.consumed),

      breachEpisodes: group.breachEpisodes,
      activeBreachEpisodes: group.activeBreachEpisodes,
      clearedBreachEpisodes: group.clearedBreachEpisodes,
    };
  });
}

export default Object.freeze({
  fetchSeverityPerformance,
});
