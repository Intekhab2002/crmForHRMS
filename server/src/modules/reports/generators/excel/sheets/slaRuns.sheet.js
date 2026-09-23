import { setupSheet, addRows, formatDateColumns } from "./_sheet.utils.js";

export function buildSlaRunsSheet(workbook, data) {
  const sheet = setupSheet(workbook, "05 SLA Runs", [
    ["Ticket", "ticketNumber", 18], ["Ticket ID", "ticketId", 38], ["Run", "runNumber", 10],
    ["Policy Code", "policyCode", 20], ["Policy Name", "policyName", 28], ["Status", "status", 14],
    ["Activated At", "activatedAt", 24], ["Paused At", "pausedAt", 24], ["Stopped At", "stoppedAt", 24],
    ["Completed At", "completedAt", 24], ["Breached At", "breachedAt", 24],
    ["Target Minutes", "target", 16], ["Elapsed Minutes", "elapsed", 16],
    ["Remaining Minutes", "remaining", 18], ["Trigger Value", "triggerValue", 20],
    ["Duration Value", "durationValue", 20], ["Assigned User", "assignedUser", 22],
    ["Department", "department", 24], ["Organization", "organization", 24], ["Source", "source", 12],
  ]);
  addRows(sheet, data.runs.map((row) => ({
    ticketNumber: row.ticket_number,
    ticketId: row.ticket_id,
    runNumber: row.run_number,
    policyCode: row.policy_code,
    policyName: row.policy_name,
    status: row.status,
    activatedAt: row.activated_at ? new Date(row.activated_at) : null,
    pausedAt: row.paused_at ? new Date(row.paused_at) : null,
    stoppedAt: row.stopped_at ? new Date(row.stopped_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    breachedAt: row.breached_at ? new Date(row.breached_at) : null,
    target: row.target_resolution_minutes,
    elapsed: row.elapsed_business_minutes,
    remaining: row.remaining_business_minutes,
    triggerValue: row.activation_field_value_key,
    durationValue: row.duration_field_value_key,
    assignedUser: row.assigned_username,
    department: row.department_name,
    organization: row.organization_name,
    source: row.source,
  })));
  formatDateColumns(sheet, ["activatedAt", "pausedAt", "stoppedAt", "completedAt", "breachedAt"]);
}
