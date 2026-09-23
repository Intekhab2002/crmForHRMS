import { heading, table } from "../reportPdf.styles.js";

export function renderTrend(doc, data) {
  heading(doc, "8. Trend Analysis");
  table(doc,
    ["Month", "Met", "Breached", "Eligible", "Compliance"],
    data.trend.map((row) => [
      row.month,
      row.met,
      row.breached,
      row.eligible,
      row.compliance == null ? "—" : `${row.compliance.toFixed(2)}%`,
    ]),
  );
}
