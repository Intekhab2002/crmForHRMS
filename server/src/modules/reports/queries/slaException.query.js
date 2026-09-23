import { EXCEPTION_CODE } from "../reports.constants.js";

export function buildExceptions(runs, segments = []) {
  const rows = [];

  for (const run of runs) {
    const snapshot = run.policy_snapshot?.policy;
    const target = Number(run.target_resolution_minutes || 0);

    if (!snapshot) {
      rows.push(exception(run, EXCEPTION_CODE.MISSING_POLICY_SNAPSHOT, "Historical policy snapshot is missing."));
      continue;
    }

    if (run.status === "RUNNING") {
      rows.push(exception(run, EXCEPTION_CODE.OPEN_AT_CUTOFF, "SLA run was still running at the report cut-off."));
    }

    if (run.status === "PAUSED") {
      rows.push(exception(run, EXCEPTION_CODE.PAUSED_AT_CUTOFF, "SLA run was paused at the report cut-off."));
    }

    if (target < 1) {
      rows.push(exception(run, EXCEPTION_CODE.MISSING_TARGET, "SLA target is missing or invalid."));
    }

    if (!snapshot.calendarId || !snapshot.timezone) {
      rows.push(exception(run, EXCEPTION_CODE.MISSING_CALENDAR, "Historical calendar evidence is incomplete."));
    }

    if (run.status === "NOT_TRACKED") {
      rows.push(exception(run, EXCEPTION_CODE.NOT_TRACKED, "SLA run was not eligible for tracking."));
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
      new Date(segment.started_at).getTime() > new Date(segment.ended_at).getTime()
    ) {
      rows.push({
        code: EXCEPTION_CODE.INVALID_SEGMENT,
        message: "Segment ended before it started.",
        ticketId: segment.ticket_id,
        runNumber: segment.run_number,
        segmentId: segment.segment_id,
      });
    }

    if (Number(segment.consumed_minutes) < 0 || Number(segment.target_minutes) < 0) {
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
