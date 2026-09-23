import { heading, paragraph } from "../reportPdf.styles.js";

export function renderMethodology(doc, data) {
  heading(doc, "11. Methodology");
  paragraph(doc, "SLA time is measured in business minutes using the historical SLA execution model.");
  paragraph(doc, "Calendar, timezone, weekend behavior and holidays are taken from the historical policy snapshot associated with the SLA run.");
  paragraph(doc, "Pauses, resumes and severity/duration changes are represented by immutable SLA execution segments.");
  paragraph(doc, "Compliance = SLA Met / (SLA Met + SLA Breached) × 100. RUNNING, PAUSED and NOT_TRACKED runs are excluded from the compliance denominator.");
  paragraph(doc, "Timing precision is whole business minutes because the existing SLA runtime stores integer business-minute values.");
  paragraph(doc, `Calculation Version: ${data.documentControl.calculationVersion}`);
}
