import { PDF_COLORS } from "../reportPdf.styles.js";

export function renderCover(doc, data) {
  doc.moveDown(2);
  doc.fillColor(PDF_COLORS.heading).font("Helvetica-Bold").fontSize(26)
    .text(data.company.name, { align: "center" });
  doc.moveDown(1);
  doc.fontSize(22).text(data.documentControl.reportType, { align: "center" });
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(11).fillColor(PDF_COLORS.muted)
    .text(`Reporting Period: ${data.documentControl.periodStart} → ${data.documentControl.periodEnd}`, { align: "center" });
  doc.text(`Report ID: ${data.documentControl.reportId}`, { align: "center" });
  doc.moveDown(3);
  doc.fontSize(10).fillColor(PDF_COLORS.text).text(data.company.classification, { align: "center" });
  doc.addPage();
}
