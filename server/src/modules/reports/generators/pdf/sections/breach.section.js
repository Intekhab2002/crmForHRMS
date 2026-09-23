import { heading, keyValueTable } from "../reportPdf.styles.js";

export function renderBreach(doc, data) {
  heading(doc, "7. Breach Analysis");
  const b = data.breachAnalysis;
  keyValueTable(doc, [
    ["Total Breaches", b.totalBreaches],
    ["Breach %", b.breachRate == null ? "—" : `${b.breachRate.toFixed(2)}%`],
    ["Average Breach Duration", format(b.averageBreachDuration)],
    ["Median Breach Duration", format(b.medianBreachDuration)],
    ["Maximum Breach Duration", format(b.maximumBreachDuration)],
  ]);
}

function format(value) {
  return value == null ? "—" : `${Number(value).toFixed(2)} business minutes`;
}
