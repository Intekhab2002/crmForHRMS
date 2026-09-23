export const PDF_COLORS = Object.freeze({
  heading: "#17365D",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#D1D5DB",
  background: "#F8FAFC",
});

export const PDF_STYLES = Object.freeze({
  title: { font: "Helvetica-Bold", size: 22 },
  heading: { font: "Helvetica-Bold", size: 14 },
  subheading: { font: "Helvetica-Bold", size: 11 },
  body: { font: "Helvetica", size: 9 },
  small: { font: "Helvetica", size: 7.5 },
});

export function heading(doc, text) {
  doc.moveDown(0.5);
  doc.fillColor(PDF_COLORS.heading).font(PDF_STYLES.heading.font).fontSize(PDF_STYLES.heading.size).text(text);
  doc.moveDown(0.25);
  doc.fillColor(PDF_COLORS.text).font(PDF_STYLES.body.font).fontSize(PDF_STYLES.body.size);
}

export function paragraph(doc, text) {
  doc.fillColor(PDF_COLORS.text).font(PDF_STYLES.body.font).fontSize(PDF_STYLES.body.size).text(String(text ?? ""));
  doc.moveDown(0.2);
}

export function keyValueTable(doc, rows) {
  const startX = doc.x;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = Math.min(170, width * 0.36);

  for (const [label, value] of rows) {
    const y = doc.y;
    doc.rect(startX, y, labelWidth, 18).stroke(PDF_COLORS.border);
    doc.rect(startX + labelWidth, y, width - labelWidth, 18).stroke(PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.text).text(label, startX + 5, y + 5, {
      width: labelWidth - 10,
      height: 12,
    });
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text).text(String(value ?? "—"), startX + labelWidth + 5, y + 5, {
      width: width - labelWidth - 10,
      height: 12,
    });
    doc.y = y + 18;
  }
  doc.moveDown(0.4);
}

export function table(doc, headers, rows, widths = null) {
  const startX = doc.x;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidths = widths || headers.map(() => width / headers.length);
  const rowHeight = 20;

  const drawRow = (values, header = false) => {
    const y = doc.y;
    let x = startX;

    values.forEach((value, index) => {
      const cellWidth = columnWidths[index];
      doc.rect(x, y, cellWidth, rowHeight).stroke(PDF_COLORS.border);
      doc.font(header ? "Helvetica-Bold" : "Helvetica")
        .fontSize(header ? 7.5 : 7)
        .fillColor(header ? PDF_COLORS.heading : PDF_COLORS.text)
        .text(String(value ?? "—"), x + 3, y + 6, {
          width: cellWidth - 6,
          height: rowHeight - 6,
          ellipsis: true,
        });
      x += cellWidth;
    });

    doc.y = y + rowHeight;
  };

  drawRow(headers, true);

  for (const row of rows) {
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      drawRow(headers, true);
    }
    drawRow(row);
  }

  doc.moveDown(0.4);
}
