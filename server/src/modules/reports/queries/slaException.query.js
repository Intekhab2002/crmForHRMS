import { EXCEPTION_CODE } from "../reports.constants.js";

export function buildExceptions(runs, segments = [], breachEpisodes = []) {
  const rows = [];

  for (const run of runs) {
    const snapshot = run.policy_snapshot?.policy;
    const target = Number(run.target_resolution_minutes || 0);

    if (!snapshot) {
      rows.push(
        exception(
          run,
          EXCEPTION_CODE.MISSING_POLICY_SNAPSHOT,
          "Historical policy snapshot is missing.",
        ),
      );
      continue;
    }

    if (run.status === "RUNNING") {
      rows.push(
        exception(
          run,
          EXCEPTION_CODE.OPEN_AT_CUTOFF,
          "SLA run was still running at the report cut-off.",
        ),
      );
    }

    if (run.status === "PAUSED") {
      rows.push(
        exception(
          run,
          EXCEPTION_CODE.PAUSED_AT_CUTOFF,
          "SLA run was paused at the report cut-off.",
        ),
      );
    }

    if (target < 1) {
      rows.push(
        exception(
          run,
          EXCEPTION_CODE.MISSING_TARGET,
          "SLA target is missing or invalid.",
        ),
      );
    }

    if (!snapshot.calendarId || !snapshot.timezone) {
      rows.push(
        exception(
          run,
          EXCEPTION_CODE.MISSING_CALENDAR,
          "Historical calendar evidence is incomplete.",
        ),
      );
    }

    if (run.status === "NOT_TRACKED") {
      rows.push(
        exception(
          run,
          EXCEPTION_CODE.NOT_TRACKED,
          "SLA run was not eligible for tracking.",
        ),
      );
    }
  }

  const grouped = new Map();

  for (const segment of segments) {
    const key = `${segment.ticket_id}:${segment.run_number}`;
    const list = grouped.get(key) || [];
    list.push(segment);
    grouped.set(key, list);

    if (
      segment.ended_at &&
      new Date(segment.started_at).getTime() >
        new Date(segment.ended_at).getTime()
    ) {
      rows.push({
        code: EXCEPTION_CODE.INVALID_SEGMENT,
        message: "Segment ended before it started.",
        ticketId: segment.ticket_id,
        runNumber: segment.run_number,
        segmentId: segment.segment_id,
      });
    }

    if (
      Number(segment.consumed_minutes) < 0 ||
      Number(segment.target_minutes) < 0
    ) {
      rows.push({
        code: EXCEPTION_CODE.INVALID_SEGMENT,
        message: "Segment contains a negative target or consumed value.",
        ticketId: segment.ticket_id,
        runNumber: segment.run_number,
        segmentId: segment.segment_id,
      });
    }
  }

  for (const [key, list] of grouped.entries()) {
    const openSegments = list.filter((segment) => !segment.ended_at);
    if (openSegments.length > 1) {
      const [ticketId, runNumber] = key.split(":");
      rows.push({
        code: EXCEPTION_CODE.INVALID_RUNTIME,
        message: "Multiple open SLA segments exist for the same SLA run.",
        ticketId,
        runNumber: Number(runNumber),
      });
    }
  }

  const segmentById = new Map(
    segments.map((segment) => [segment.segment_id, segment]),
  );

  const activeEpisodesByRun = new Map();

  for (const episode of breachEpisodes) {
    const runKey = `${episode.ticket_id}:${episode.run_number}`;

    const segment = episode.segment_id
      ? segmentById.get(episode.segment_id)
      : null;

    const breachTime = new Date(episode.breached_at).getTime();

    const clearTime = episode.cleared_at
      ? new Date(episode.cleared_at).getTime()
      : null;

    const breachSeconds = Number(episode.elapsed_business_seconds_at_breach);

    const clearSeconds =
      episode.elapsed_business_seconds_at_clear == null
        ? null
        : Number(episode.elapsed_business_seconds_at_clear);

    const addEpisodeException = (message) => {
      rows.push({
        code: EXCEPTION_CODE.INVALID_RUNTIME,
        message,
        ticketId: episode.ticket_id,
        runNumber: Number(episode.run_number),
        episodeId: episode.id,
        segmentId: episode.segment_id,
      });
    };

    if (!Number.isFinite(breachTime)) {
      addEpisodeException("Breach episode has an invalid breach timestamp.");
    }

    if (!Number.isFinite(breachSeconds) || breachSeconds < 0) {
      addEpisodeException(
        "Breach episode has invalid elapsed business seconds.",
      );
    }

    if (
      episode.segment_id &&
      (!segment ||
        segment.ticket_id !== episode.ticket_id ||
        Number(segment.run_number) !== Number(episode.run_number) ||
        segment.ticket_sla_id !== episode.ticket_sla_id)
    ) {
      addEpisodeException(
        "Breach episode references a segment outside its SLA run.",
      );
    }

    if (episode.cleared_at) {
      if (!Number.isFinite(clearTime) || clearTime < breachTime) {
        addEpisodeException(
          "Breach episode clearance timestamp precedes its breach timestamp.",
        );
      }

      if (
        clearSeconds == null ||
        !Number.isFinite(clearSeconds) ||
        clearSeconds < 0 ||
        clearSeconds < breachSeconds
      ) {
        addEpisodeException(
          "Breach episode has invalid clearance elapsed seconds.",
        );
      }
    } else {
      const active = activeEpisodesByRun.get(runKey) || [];
      active.push(episode);
      activeEpisodesByRun.set(runKey, active);
    }
  }

  for (const [runKey, activeEpisodes] of activeEpisodesByRun) {
    if (activeEpisodes.length > 1) {
      const [ticketId, runNumber] = runKey.split(":");

      rows.push({
        code: EXCEPTION_CODE.INVALID_RUNTIME,
        message: "Multiple active breach episodes exist for the same SLA run.",
        ticketId,
        runNumber: Number(runNumber),
      });
    }
  }

  return rows;
}

function exception(run, code, message) {
  return {
    code,
    message,
    ticketId: run.ticket_id,
    ticketNumber: run.ticket_number,
    runNumber: run.run_number,
    status: run.status,
  };
}

export default Object.freeze({ buildExceptions });
