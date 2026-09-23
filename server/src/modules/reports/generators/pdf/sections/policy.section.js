import { heading, table } from "../reportPdf.styles.js";

export function renderPolicy(doc, data) {
  heading(doc, "5. Policy Performance");
  table(doc,
    ["Policy", "Runs", "Eligible", "Met", "Breached", "Compliance", "Avg Resolution", "Median", "Avg Target"],
    data.policyPerformance.map((row) => [
      row.policyName,
      row.totalRuns,
      row.eligibleRuns,
      row.metRuns,
      row.breachedRuns,
      row.complianceRate == null ? "—" : `${row.complianceRate.toFixed(2)}%`,
      format(row.averageResolution),
      format(row.medianResolution),
      format(row.averageTarget),
    ]),
  );
}

function format(value) {
  return value == null ? "—" : Number(value).toFixed(2);
}
