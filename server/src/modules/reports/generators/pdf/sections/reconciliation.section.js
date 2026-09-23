import { heading, keyValueTable, table } from "../reportPdf.styles.js";

export function renderReconciliation(doc, data) {
  heading(doc, "10. Data Quality & Reconciliation");
  keyValueTable(doc, [
    ["Status", data.reconciliation.status],
    ["SLA Runs", data.reconciliation.runCount],
    ["Exceptions", data.reconciliation.exceptionCount],
  ]);
  table(doc,
    ["Control", "Expected", "Actual", "Result"],
    data.reconciliation.checks.map((row) => [
      row.code,
      row.expected,
      row.actual,
      row.pass ? "PASS" : "FAIL",
    ]),
  );
}
