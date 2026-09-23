import PDFDocument from "pdfkit";

import { renderCover } from "./sections/cover.section.js";
import { renderDocumentControl } from "./sections/documentControl.section.js";
import { renderScope } from "./sections/scope.section.js";
import { renderSummary } from "./sections/summary.section.js";
import { renderPolicy } from "./sections/policy.section.js";
import { renderSeverity } from "./sections/severity.section.js";
import { renderBreach } from "./sections/breach.section.js";
import { renderTrend } from "./sections/trend.section.js";
import { renderExceptions } from "./sections/exceptions.section.js";
import { renderReconciliation } from "./sections/reconciliation.section.js";
import { renderMethodology } from "./sections/methodology.section.js";
import { renderDataSources } from "./sections/dataSources.section.js";
import { renderAuditEvidence } from "./sections/auditEvidence.section.js";
import { renderAppendix } from "./sections/appendix.section.js";
import { PDF_COLORS } from "./reportPdf.styles.js";

export async function generateReportPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 55, right: 42, bottom: 50, left: 42 },
      bufferPages: true,
      info: {
        Title: data.documentControl.reportType,
        Author: data.company.name,
        Subject: data.documentControl.reportId,
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    renderCover(doc, data);
    renderDocumentControl(doc, data);
    renderScope(doc, data);
    renderSummary(doc, data);
    renderPolicy(doc, data);
    renderSeverity(doc, data);
    renderBreach(doc, data);
    renderTrend(doc, data);
    renderExceptions(doc, data);
    renderReconciliation(doc, data);
    renderMethodology(doc, data);
    renderDataSources(doc, data);
    renderAuditEvidence(doc, data);
    renderAppendix(doc, data);

    const pages = doc.bufferedPageRange();
    for (let index = 0; index < pages.count; index += 1) {
      doc.switchToPage(index);
      const y = doc.page.height - 30;
      doc.strokeColor("#D1D5DB").moveTo(42, y - 8).lineTo(doc.page.width - 42, y - 8).stroke();
      doc.font("Helvetica").fontSize(7).fillColor(PDF_COLORS.muted);
      doc.text(data.company.classification, 42, y, { width: 220 });
      doc.text(data.documentControl.reportId, doc.page.width / 2 - 70, y, {
        width: 140,
        align: "center",
      });
      doc.text(`Page ${index + 1} of ${pages.count}`, doc.page.width - 150, y, {
        width: 108,
        align: "right",
      });
    }

    doc.end();
  });
}

export default Object.freeze({ generateReportPdf });
