import { heading, keyValueTable } from "../reportPdf.styles.js";

export function renderSummary(doc, data) {
  heading(doc, "4. Executive Summary");
  const c = data.compliance;
  keyValueTable(doc, [
    ["Total SLA Runs", c.totalRuns],
    ["Eligible SLA Runs", c.eligibleRuns],
    ["SLA Met", c.metRuns],
    ["SLA Breached", c.breachedRuns],
    ["Running", c.runningRuns],
    ["Paused", c.pausedRuns],
    ["Stopped", c.stoppedRuns],
    ["Not Tracked", c.notTrackedRuns],
    ["Compliance %", c.complianceRate == null ? "—" : `${c.complianceRate.toFixed(2)}%`],
  ]);
}
