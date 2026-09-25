export const PDF_COLORS = Object.freeze({
  heading: "#17365D",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#D1D5DB",
  background: "#F8FAFC",
});

export const PDF_STYLES = Object.freeze({
  title: {
    font: "Helvetica-Bold",
    size: 22,
  },

  heading: {
    font: "Helvetica-Bold",
    size: 14,
  },

  subheading: {
    font: "Helvetica-Bold",
    size: 11,
  },

  body: {
    font: "Helvetica",
    size: 9,
  },

  small: {
    font: "Helvetica",
    size: 7.5,
  },
});

const TABLE_ROW_MIN_HEIGHT = 18;
const TABLE_CELL_PADDING_X = 4;
const TABLE_CELL_PADDING_Y = 4;
const TABLE_FONT_SIZE = 7;
const TABLE_HEADER_FONT_SIZE = 7.5;
const TABLE_LINE_GAP = 1;
const CONTENT_BOTTOM_GAP = 8;

/**
 * PDFKit does not reliably wrap very long unbroken tokens such as UUIDs,
 * hashes and long identifiers. Insert zero-width break opportunities into
 * long runs while preserving the displayed text.
 */
function prepareCellText(value) {
  const text = String(value ?? "—");

  return text.replace(
    /(\S{18})(?=\S)/g,
    "$1\u200B",
  );
}

function getContentX(doc) {
  return doc.page.margins.left;
}

function getContentWidth(doc) {
  return (
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right
  );
}

function getContentBottom(doc) {
  return (
    doc.page.height -
    doc.page.margins.bottom -
    CONTENT_BOTTOM_GAP
  );
}

function resetCursorX(doc) {
  doc.x = getContentX(doc);
}

function ensurePageSpace(doc, requiredHeight) {
  const available =
    getContentBottom(doc) - doc.y;

  if (requiredHeight <= available) {
    return false;
  }

  doc.addPage();
  resetCursorX(doc);

  return true;
}

function normalizeColumnWidths(widths, columnCount, totalWidth) {
  if (
    Array.isArray(widths) &&
    widths.length === columnCount
  ) {
    const suppliedTotal = widths.reduce(
      (sum, value) => sum + Number(value || 0),
      0,
    );

    if (suppliedTotal > 0) {
      const scale = totalWidth / suppliedTotal;

      return widths.map(
        (value) => Number(value || 0) * scale,
      );
    }
  }

  return Array.from(
    { length: columnCount },
    () => totalWidth / columnCount,
  );
}

function getTextHeight(doc, value, width, font, fontSize) {
  const text = prepareCellText(value);

  doc.font(font).fontSize(fontSize);

  return Math.max(
    TABLE_ROW_MIN_HEIGHT - TABLE_CELL_PADDING_Y * 2,
    doc.heightOfString(text, {
      width: Math.max(
        1,
        width - TABLE_CELL_PADDING_X * 2,
      ),
      lineGap: TABLE_LINE_GAP,
    }),
  );
}

function getTableRowHeight(
  doc,
  values,
  columnWidths,
  header = false,
) {
  const font = header
    ? "Helvetica-Bold"
    : "Helvetica";

  const fontSize = header
    ? TABLE_HEADER_FONT_SIZE
    : TABLE_FONT_SIZE;

  const contentHeight = values.reduce(
    (maxHeight, value, index) => {
      const height = getTextHeight(
        doc,
        value,
        columnWidths[index],
        font,
        fontSize,
      );

      return Math.max(maxHeight, height);
    },
    0,
  );

  return Math.max(
    TABLE_ROW_MIN_HEIGHT,
    contentHeight +
      TABLE_CELL_PADDING_Y * 2,
  );
}

export function heading(doc, text) {
  const value = prepareCellText(text);

  doc.moveDown(0.5);

  ensurePageSpace(doc, 30);

  resetCursorX(doc);

  doc
    .fillColor(PDF_COLORS.heading)
    .font(PDF_STYLES.heading.font)
    .fontSize(PDF_STYLES.heading.size)
    .text(
      value,
      getContentX(doc),
      doc.y,
      {
        width: getContentWidth(doc),
      },
    );

  resetCursorX(doc);

  doc.moveDown(0.25);

  doc
    .fillColor(PDF_COLORS.text)
    .font(PDF_STYLES.body.font)
    .fontSize(PDF_STYLES.body.size);

  resetCursorX(doc);
}

export function paragraph(doc, text) {
  const value = prepareCellText(text);

  resetCursorX(doc);

  doc
    .fillColor(PDF_COLORS.text)
    .font(PDF_STYLES.body.font)
    .fontSize(PDF_STYLES.body.size)
    .text(
      value,
      getContentX(doc),
      doc.y,
      {
        width: getContentWidth(doc),
        lineGap: 1,
      },
    );

  resetCursorX(doc);

  doc.moveDown(0.2);

  resetCursorX(doc);
}

export function keyValueTable(doc, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const startX = getContentX(doc);
  const width = getContentWidth(doc);
  const labelWidth = Math.min(
    170,
    width * 0.36,
  );

  for (const [label, value] of rows) {
    const labelText = prepareCellText(label);
    const valueText = prepareCellText(value);

    doc.font("Helvetica-Bold").fontSize(8);

    const labelHeight = doc.heightOfString(
      labelText,
      {
        width: labelWidth - 10,
        lineGap: 1,
      },
    );

    doc.font("Helvetica").fontSize(8);

    const valueHeight = doc.heightOfString(
      valueText,
      {
        width: width - labelWidth - 10,
        lineGap: 1,
      },
    );

    const rowHeight = Math.max(
      18,
      Math.max(labelHeight, valueHeight) + 10,
    );

    ensurePageSpace(doc, rowHeight);

    const y = doc.y;

    doc
      .rect(
        startX,
        y,
        labelWidth,
        rowHeight,
      )
      .stroke(PDF_COLORS.border);

    doc
      .rect(
        startX + labelWidth,
        y,
        width - labelWidth,
        rowHeight,
      )
      .stroke(PDF_COLORS.border);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(PDF_COLORS.text)
      .text(
        labelText,
        startX + 5,
        y + 5,
        {
          width: labelWidth - 10,
          lineGap: 1,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(PDF_COLORS.text)
      .text(
        valueText,
        startX + labelWidth + 5,
        y + 5,
        {
          width: width - labelWidth - 10,
          lineGap: 1,
        },
      );

    doc.y = y + rowHeight;

    resetCursorX(doc);
  }

  doc.moveDown(0.4);

  resetCursorX(doc);
}

export function table(
  doc,
  headers,
  rows,
  widths = null,
) {
  if (
    !Array.isArray(headers) ||
    headers.length === 0
  ) {
    return;
  }

  const safeRows = Array.isArray(rows)
    ? rows
    : [];

  const startX = getContentX(doc);
  const width = getContentWidth(doc);

  const columnWidths = normalizeColumnWidths(
    widths,
    headers.length,
    width,
  );

  const drawRow = (
    values,
    header = false,
  ) => {
    const rowHeight = getTableRowHeight(
      doc,
      values,
      columnWidths,
      header,
    );

    /*
     * Important:
     * This function is only called after the caller has checked that the
     * complete row fits on the page. Therefore the row is drawn atomically.
     */
    const y = doc.y;
    let x = startX;

    values.forEach((value, index) => {
      const cellWidth =
        columnWidths[index] ??
        width / headers.length;

      const text = prepareCellText(value);

      doc
        .rect(
          x,
          y,
          cellWidth,
          rowHeight,
        )
        .stroke(PDF_COLORS.border);

      doc
        .font(
          header
            ? "Helvetica-Bold"
            : "Helvetica",
        )
        .fontSize(
          header
            ? TABLE_HEADER_FONT_SIZE
            : TABLE_FONT_SIZE,
        )
        .fillColor(
          header
            ? PDF_COLORS.heading
            : PDF_COLORS.text,
        )
        .text(
          text,
          x + TABLE_CELL_PADDING_X,
          y + TABLE_CELL_PADDING_Y,
          {
            width:
              cellWidth -
              TABLE_CELL_PADDING_X * 2,
            height:
              rowHeight -
              TABLE_CELL_PADDING_Y * 2,
            lineGap: TABLE_LINE_GAP,
            lineBreak: true,
          },
        );

      x += cellWidth;
    });

    doc.y = y + rowHeight;

    resetCursorX(doc);

    return rowHeight;
  };

  const headerHeight = getTableRowHeight(
    doc,
    headers,
    columnWidths,
    true,
  );

  /*
   * Keep the header with the first data row whenever possible.
   * At minimum, the header itself must fit on the page.
   */
  ensurePageSpace(
    doc,
    headerHeight,
  );

  drawRow(headers, true);

  for (const row of safeRows) {
    const rowValues = Array.isArray(row)
      ? row
      : headers.map(
          (_, index) => row?.[index],
        );

    const rowHeight = getTableRowHeight(
      doc,
      rowValues,
      columnWidths,
      false,
    );

    /*
     * Never split a row.
     *
     * If the complete row does not fit in the current page's remaining
     * printable area, create a new page and repeat the table header.
     */
    if (
      rowHeight >
      getContentBottom(doc) - doc.y
    ) {
      doc.addPage();
      resetCursorX(doc);

      drawRow(headers, true);
    }

    /*
     * A single row is now guaranteed to be drawn as one unit.
     */
    drawRow(rowValues, false);
  }

  doc.moveDown(0.4);

  resetCursorX(doc);
}