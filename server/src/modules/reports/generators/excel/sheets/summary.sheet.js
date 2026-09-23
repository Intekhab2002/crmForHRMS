import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildSummarySheet(workbook, data) {
  const sheet = setupSheet(workbook, "01 Summary", [
    ["Metric", "metric", 34],
    ["Value", "value", 28],
  ]);

  const c = data.compliance;
  addRows(sheet, [
    ["Report ID", data.documentControl.reportId],
    ["Report Type", data.documentControl.reportType],
    ["Report Version", data.documentControl.reportVersion],
    ["Calculation Version", data.documentControl.calculationVersion],
    ["Reporting Period", `${data.documentControl.periodStart} → ${data.documentControl.periodEnd}`],
    ["Data Cut-off", data.documentControl.dataCutoff],
    ["Timezone", data.documentControl.timezone],
    ["Total SLA Runs", c.totalRuns],
    ["Eligible SLA Runs", c.eligibleRuns],
    ["SLA Met", c.metRuns],
    ["SLA Breached", c.breachedRuns],
    ["Running", c.runningRuns],
    ["Paused", c.pausedRuns],
    ["Stopped", c.stoppedRuns],
    ["Not Tracked", c.notTrackedRuns],
    ["Compliance %", c.complianceRate],
    ["Average Business Resolution", data.metrics.averageBusinessResolution],
    ["Median Business Resolution", data.metrics.medianBusinessResolution],
    ["Maximum Business Resolution", data.metrics.maximumBusinessResolution],
    ["Reconciliation", data.reconciliation.status],
  ]);
}
