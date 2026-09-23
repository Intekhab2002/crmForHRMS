import { heading, paragraph } from "../reportPdf.styles.js";

export function renderAuditEvidence(doc, data) {
  heading(doc, "13. Audit Evidence");
  paragraph(doc, "Every summarized compliance result is traceable to the logical SLA execution identity ticket_id + run_number.");
  paragraph(doc, `Evidence population: ${data.runs.length} SLA runs and ${data.segments.length} execution segments.`);
  paragraph(doc, "A run can be traced to its ticket, policy snapshot, target, calendar evidence, segments, consumed business minutes and final outcome.");
}
