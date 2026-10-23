
import {
  setupSheet,
  addRows,
  formatDateColumns,
} from "./_sheet.utils.js";

export function buildSegmentsSheet(workbook, data) {
  const sheet = setupSheet(workbook, "06 SLA Segments", [
    ["Segment No.", "segmentNumber", 14],
    ["Ticket Number", "ticketNumber", 22],
    ["SLA Run No.", "runNumber", 14],
    ["Started At", "startedAt", 24],
    ["Ended At", "endedAt", 24],
    ["Trigger", "trigger", 20],
    ["Duration Value", "duration", 20],
    ["Target (Minutes)", "target", 18],
    ["Consumed (Minutes)", "consumed", 20],
    ["Status", "status", 14],
    ["End Reason", "endReason", 22],
  ]);

  // Resolve ticket UUIDs to business-facing ticket numbers.
  const ticketNumberById = new Map(
    (data.runs || []).map((run) => [
      run.ticket_id,
      run.ticket_number,
    ]),
  );

  // Assign a readable sequence within each ticket + SLA run.
  // fetchSegments() already orders segments by ticket, run, and start time.
  const segmentNumbers = new Map();

  const rows = (data.segments || []).map((segment) => {
    const runKey = `${segment.ticket_id}:${segment.run_number}`;
    const segmentNumber = (segmentNumbers.get(runKey) || 0) + 1;

    segmentNumbers.set(runKey, segmentNumber);

    return {
      segmentNumber: `Segment ${segmentNumber}`,
      ticketNumber: ticketNumberById.get(segment.ticket_id) || "Unknown",
      runNumber: segment.run_number,
      startedAt: segment.started_at
        ? new Date(segment.started_at)
        : null,
      endedAt: segment.ended_at
        ? new Date(segment.ended_at)
        : null,
      trigger: segment.trigger_value_key,
      duration: segment.duration_value_key,
      target: segment.target_minutes,
      consumed: segment.consumed_minutes,
      status: segment.status,
      endReason: segment.end_reason,
    };
  });

  addRows(sheet, rows);
  formatDateColumns(sheet, ["startedAt", "endedAt"]);
}

export default Object.freeze({ buildSegmentsSheet });
