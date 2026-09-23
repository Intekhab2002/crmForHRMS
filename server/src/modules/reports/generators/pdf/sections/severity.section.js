import { heading, table } from "../reportPdf.styles.js";

export function renderSeverity(doc, data) {
  heading(doc, "6. Severity Performance");
  table(doc,
    ["Severity", "Runs", "Met", "Breached", "Compliance", "Avg Target", "Avg Consumed"],
    data.severityPerformance.map((row) => [
      row.severity,
      row.runs,
      row.met,
      row.breached,
      row.compliance == null ? "—" : `${row.compliance.toFixed(2)}%`,
      format(row.averageTarget),
      format(row.averageConsumed),
    ]),
  );
}

function format(value) {
  return value == null ? "—" : Number(value).toFixed(2);
}
