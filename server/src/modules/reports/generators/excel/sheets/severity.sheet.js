import { setupSheet, addRows } from "./_sheet.utils.js";

export function buildSeveritySheet(workbook, data) {
  const sheet = setupSheet(workbook, "03 Severity Performance", [
    ["Severity", "severity", 24], ["Runs", "runs", 12], ["Met", "met", 12],
    ["Breached", "breached", 12], ["Compliance %", "compliance", 16],
    ["Avg Target", "averageTarget", 16], ["Avg Consumed", "averageConsumed", 18],
    ["Breach Episodes", "breachEpisodes", 18],
["Active Episodes", "activeBreachEpisodes", 18],
["Cleared Episodes", "clearedBreachEpisodes", 18],
["Breached Runs", "breachedRuns", 16],
["Met Runs", "metRuns", 12],
  ]);
  addRows(sheet, data.severityPerformance);
}
