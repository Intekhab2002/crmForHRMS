import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildExceptionsSheet(workbook, data) {
  const sheet = setupSheet(workbook, "07 Exceptions", [
    ["Code", "code", 28], ["Ticket", "ticketNumber", 18], ["Ticket ID", "ticketId", 38],
    ["Run", "runNumber", 10], ["Status", "status", 14], ["Message", "message", 60],
  ]);
  addRows(sheet, data.exceptions);
}
