import { setupSheet, addRows, formatDateColumns } from "./_sheet.utils.js";

export function buildSlaTicketDetailsSheet(workbook, data) {
  const sheet = setupSheet(workbook, "SLA Ticket Details", [
    ["Ticket No.", "ticketNumber", 18],
    ["Subject", "subject", 42],
    ["Target (Business Minutes)", "targetMinutes", 22],
    ["Elapsed (Business Minutes)", "elapsedMinutes", 24],
    ["Remaining (Business Minutes)", "remainingMinutes", 26],
    ["Due Time", "dueAt", 24],
    ["SLA Policy", "policyName", 30],
    ["SLA Activated At", "activatedAt", 24],
  ]);
  addRows(sheet, (data.ticketDetails || []).map((r) => ({
    ticketNumber: r.ticketNumber,
    subject: r.subject,
    targetMinutes: r.targetMinutes,
    elapsedMinutes: r.elapsedMinutes,
    remainingMinutes: r.remainingMinutes,
    dueAt: r.dueAt ? new Date(r.dueAt) : null,
    policyName: r.policyName,
    activatedAt: r.activatedAt ? new Date(r.activatedAt) : null,
  })));
  formatDateColumns(sheet, ["dueAt", "activatedAt"]);
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.alignment = { ...row.alignment, vertical: "top", wrapText: true };
  });
  return sheet;
}
export default buildSlaTicketDetailsSheet;
