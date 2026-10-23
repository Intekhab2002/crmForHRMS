import { setupSheet, addRows, formatDateColumns } from "./_sheet.utils.js";

export function buildSlaTicketDetailsSheet(workbook, data) {
  const sheet = setupSheet(workbook, "SLA Ticket Details", [
    ["Ticket Number", "ticketNumber", 22],
    ["Ticket Created Time", "ticketCreatedAt", 24],
    ["SLA Policy", "policyName", 28],
    ["SLA Activated At", "activatedAt", 24],
    ["Target (Business Minutes)", "targetMinutes", 24],
    ["Elapsed (Business Minutes)", "elapsedMinutes", 24],
    ["Remaining (Business Minutes)", "remainingMinutes", 26],
    ["Breach Time (Business Minutes)", "breachMinutes", 28],
    ["Breach Timestamp", "breachedAt", 24],
    ["Due Time", "dueAt", 24],
    ["Ticket Last Updated Time", "ticketLastUpdatedAt", 26],
    ["SLA Status", "status", 16],
  ]);

  addRows(
    sheet,
    (data.ticketDetails || []).map((row) => ({
      ticketNumber: row.ticketNumber,
      ticketCreatedAt: row.ticketCreatedAt
        ? new Date(row.ticketCreatedAt)
        : null,
      policyName: row.policyName,
      activatedAt: row.activatedAt ? new Date(row.activatedAt) : null,
      targetMinutes: row.targetMinutes,
      elapsedMinutes: row.elapsedMinutes,
      remainingMinutes: row.remainingMinutes,
      breachMinutes: row.breachMinutes,
      breachedAt: row.breachedAt ? new Date(row.breachedAt) : null,
      dueAt: row.dueAt ? new Date(row.dueAt) : null,
      ticketLastUpdatedAt: row.ticketLastUpdatedAt
        ? new Date(row.ticketLastUpdatedAt)
        : null,
      status: row.status,
    })),
  );

  formatDateColumns(sheet, [
    "ticketCreatedAt",
    "activatedAt",
    "breachedAt",
    "dueAt",
    "ticketLastUpdatedAt",
  ]);

  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.alignment = {
      ...row.alignment,
      vertical: "top",
      wrapText: true,
    };
  });

  return sheet;
}

export default buildSlaTicketDetailsSheet;
