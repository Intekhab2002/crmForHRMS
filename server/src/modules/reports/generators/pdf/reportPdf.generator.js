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

const PDF_MARGINS = Object.freeze({
  top: 55,
  right: 42,
  bottom: 72,
  left: 42,
});

const FOOTER = Object.freeze({
  lineOffset: 8,
  textOffset: 30,
  sideWidth: 220,
  centerWidth: 140,
  rightWidth: 108,
});

/**
 * Footer is intentionally placed inside a reserved footer band.
 *
 * The PDF bottom margin is 72pt while the footer text starts at 30pt from
 * the bottom of the page. This leaves a protected gap between report data
 * and footer content.
 */
function renderFooter(doc, data, pageNumber, pageCount) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const footerY =
    pageHeight - FOOTER.textOffset;

  const footerLineY =
    footerY - FOOTER.lineOffset;

  doc
    .strokeColor("#D1D5DB")
    .moveTo(
      PDF_MARGINS.left,
      footerLineY,
    )
    .lineTo(
      pageWidth - PDF_MARGINS.right,
      footerLineY,
    )
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(PDF_COLORS.muted);

  doc.text(
    String(data.company.classification ?? ""),
    PDF_MARGINS.left,
    footerY,
    {
      width: FOOTER.sideWidth,
      lineBreak: false,
    },
  );

  doc.text(
    String(
      data.documentControl.reportId ?? "",
    ),
    pageWidth / 2 -
      FOOTER.centerWidth / 2,
    footerY,
    {
      width: FOOTER.centerWidth,
      align: "center",
      lineBreak: false,
    },
  );

  doc.text(
    `Page ${pageNumber} of ${pageCount}`,
    pageWidth -
      PDF_MARGINS.right -
      FOOTER.rightWidth,
    footerY,
    {
      width: FOOTER.rightWidth,
      align: "right",
      lineBreak: false,
    },
  );

  /*
   * Restore the normal content cursor after writing the footer.
   * This prevents footer rendering from affecting subsequent PDF operations.
   */
  doc.x = PDF_MARGINS.left;
  doc.y = pageHeight - PDF_MARGINS.bottom;
}

export async function generateReportPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: PDF_MARGINS,
      bufferPages: true,
      info: {
        Title: data.documentControl.reportType,
        Author: data.company.name,
        Subject: data.documentControl.reportId,
      },
    });

    const chunks = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("error", reject);

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

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

    /*
     * Footer rendering is deliberately performed only after all report
     * sections have been generated, because bufferPages=true allows us to
     * safely decorate every finalized page.
     */
    const pages = doc.bufferedPageRange();

    for (
      let index = 0;
      index < pages.count;
      index += 1
    ) {
      doc.switchToPage(index);

      renderFooter(
        doc,
        data,
        index + 1,
        pages.count,
      );
    }

    doc.end();
  });
}

export default Object.freeze({
  generateReportPdf,
});
