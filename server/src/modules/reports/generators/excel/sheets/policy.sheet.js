import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildPolicySheet(workbook, data) {
  const sheet = setupSheet(workbook, "02 Policy Performance", [
    ["Policy", "policy", 28], ["Runs", "runs", 12], ["Eligible", "eligible", 12],
    ["Met", "met", 12], ["Breached", "breached", 12], ["Compliance %", "compliance", 16],
    ["Avg Resolution", "averageResolution", 18], ["Median Resolution", "medianResolution", 18],
    ["Avg Target", "averageTarget", 16],
  ]);
  addRows(sheet, data.policyPerformance.map((row) => ({
    policy: row.policyName,
    runs: row.totalRuns,
    eligible: row.eligibleRuns,
    met: row.metRuns,
    breached: row.breachedRuns,
    compliance: row.complianceRate,
    averageResolution: row.averageResolution,
    medianResolution: row.medianResolution,
    averageTarget: row.averageTarget,
  })));
}
