import { getQueryExecutor } from "../../../database/queryExecutor.js";

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function cutoffEpisodes(episodes, cutoff) {
  const cutoffTime = new Date(cutoff).getTime();

  return episodes.filter((episode) => {
    const breachedAt = new Date(episode.breached_at).getTime();

    return Number.isFinite(breachedAt) && breachedAt <= cutoffTime;
  });
}

export async function fetchSeverityPerformance(
  runs,
  breachEpisodes = [],
  dataCutoff = new Date().toISOString(),
  tx = null,
) {
  if (!runs.length) return [];

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
      ORDER BY seg.started_at
    `,
    [ticketIds],
  );

  const runByKey = new Map(
    runs.map((run) => [`${run.ticket_id}:${run.run_number}`, run]),
  );

  const relevantEpisodes = cutoffEpisodes(breachEpisodes, dataCutoff);

  const episodesBySegment = new Map();

  for (const episode of relevantEpisodes) {
    if (!episode.segment_id) continue;

    const list = episodesBySegment.get(episode.segment_id) || [];

    list.push(episode);
    episodesBySegment.set(episode.segment_id, list);
  }

  const groups = new Map();

  for (const segment of result.rows) {
    const runKey = `${segment.ticket_id}:${segment.run_number}`;

    const run = runByKey.get(runKey);

    if (!run) continue;

    const severity = segment.duration_value_key || "UNKNOWN";

    const group = groups.get(severity) || {
      severity,
      runs: new Set(),
      breachedRuns: new Set(),
      metRuns: new Set(),
      breachEpisodes: 0,
      activeBreachEpisodes: 0,
      clearedBreachEpisodes: 0,
      targets: [],
      consumed: [],
    };

    group.runs.add(runKey);

    if (Number(segment.target_minutes) > 0) {
      group.targets.push(Number(segment.target_minutes));
    }

    const consumedSeconds =
      segment.consumed_business_seconds ??
      Number(segment.consumed_minutes || 0) * 60;

    group.consumed.push(Number(consumedSeconds) / 60);

    const segmentEpisodes = episodesBySegment.get(segment.segment_id) || [];

    group.breachEpisodes += segmentEpisodes.length;

    const segmentActiveEpisodes = segmentEpisodes.filter((episode) => {
      const clearedAt = episode.cleared_at
        ? new Date(episode.cleared_at).getTime()
        : null;

      const cutoffTime = new Date(dataCutoff).getTime();

      return (
        clearedAt == null ||
        !Number.isFinite(clearedAt) ||
        clearedAt > cutoffTime
      );
    });

    group.activeBreachEpisodes += segmentActiveEpisodes.length;

    group.clearedBreachEpisodes +=
      segmentEpisodes.length - segmentActiveEpisodes.length;
    // A run is breached when it breached at any point
    // in its lifecycle. Attribute the breach to the
    // segment recorded by the episode, not every segment.
    if (segmentEpisodes.length) {
      group.breachedRuns.add(runKey);
    }

    groups.set(severity, group);
  }

  // A run with no breach episode can be counted as met
  // only if it has a terminal status and valid target.
  for (const group of groups.values()) {
    for (const runKey of group.runs) {
      const run = runByKey.get(runKey);

      if (!run || group.breachedRuns.has(runKey)) continue;

      if (
        ["COMPLETED", "STOPPED"].includes(run.status) &&
        Number(run.target_resolution_minutes) > 0 &&
        Number(run.elapsed_business_minutes) <=
          Number(run.target_resolution_minutes)
      ) {
        group.metRuns.add(runKey);
      }
    }
  }

  return [...groups.values()].map((group) => {
    const breached = group.breachedRuns.size;
    const met = group.metRuns.size;

    return {
      severity: group.severity,
      runs: group.runs.size,
      met,
      breached,
      compliance: met + breached ? (met / (met + breached)) * 100 : null,
      averageTarget: average(group.targets),
      averageConsumed: average(group.consumed),

      breachEpisodes: group.breachEpisodes,
      activeBreachEpisodes: group.activeBreachEpisodes,
      clearedBreachEpisodes: group.clearedBreachEpisodes,
      metRuns: met,
      breachedRuns: breached,
    };
  });
}

export default Object.freeze({
  fetchSeverityPerformance,
});
