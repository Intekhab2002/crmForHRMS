import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildReconciliationSheet(workbook, data) {
  const sheet = setupSheet(workbook, "08 Reconciliation", [
    ["Control", "code", 34], ["Expected", "expected", 18],
    ["Actual", "actual", 18], ["Result", "result", 14],
  ]);
  addRows(sheet, data.reconciliation.checks.map((row) => ({
    code: row.code,
    expected: row.expected,
    actual: row.actual,
    result: row.pass ? "PASS" : "FAIL",
  })));
  sheet.addRow({});
  sheet.addRow({ code: "Overall", result: data.reconciliation.status });
}
