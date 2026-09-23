import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildBreachesSheet(workbook, data) {
  const sheet = setupSheet(workbook, "04 Breach Analysis", [
    ["Ticket", "ticketNumber", 18], ["Run", "runNumber", 10], ["Policy", "policyName", 28],
    ["Status", "status", 14], ["Target Minutes", "target", 16], ["Elapsed Minutes", "elapsed", 16],
    ["Breach Minutes", "breachMinutes", 16], ["Activated At", "activatedAt", 24],
  ]);
  addRows(sheet, data.breachAnalysis.rows.map((row) => ({
    ticketNumber: row.ticket_number,
    runNumber: row.run_number,
    policyName: row.policy_name,
    status: row.status,
    target: row.target_resolution_minutes,
    elapsed: row.elapsed_business_minutes,
    breachMinutes: row.breachMinutes,
    activatedAt: row.activated_at,
  })));
}
