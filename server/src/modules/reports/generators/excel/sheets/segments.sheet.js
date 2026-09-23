import { setupSheet, addRows, formatDateColumns } from "./_sheet.utils.js";

export function buildSegmentsSheet(workbook, data) {
  const sheet = setupSheet(workbook, "06 SLA Segments", [
    ["Segment ID", "segmentId", 38], ["Ticket ID", "ticketId", 38], ["Run", "runNumber", 10],
    ["Started At", "startedAt", 24], ["Ended At", "endedAt", 24], ["Trigger", "trigger", 20],
    ["Duration Value", "duration", 20], ["Target Minutes", "target", 16],
    ["Consumed Minutes", "consumed", 18], ["Status", "status", 14], ["End Reason", "endReason", 22],
  ]);
  addRows(sheet, data.segments.map((row) => ({
    segmentId: row.segment_id,
    ticketId: row.ticket_id,
    runNumber: row.run_number,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    trigger: row.trigger_value_key,
    duration: row.duration_value_key,
    target: row.target_minutes,
    consumed: row.consumed_minutes,
    status: row.status,
    endReason: row.end_reason,
  })));
  formatDateColumns(sheet, ["startedAt", "endedAt"]);
}
