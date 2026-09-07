import { TICKET_EXPORT_COLUMNS } from "./ticketExport.constants.js";

const CSV_BOM = "\uFEFF";

function normalizeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function protectSpreadsheetFormula(value) {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

function escapeCsvValue(value) {
  const normalized = protectSpreadsheetFormula(normalizeCsvValue(value));

  if (!/[",\r\n\t]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

function encodeCsvRow(row) {
  return `${row.map(escapeCsvValue).join(",")}\r\n`;
}

function encodeCsvHeader() {
  return encodeCsvRow(TICKET_EXPORT_COLUMNS.map((column) => column.header));
}

function encodeTicketExportRow(mappedRow) {
  return encodeCsvRow(
    TICKET_EXPORT_COLUMNS.map((column) => mappedRow[column.key]),
  );
}

export {
  CSV_BOM,
  encodeCsvHeader,
  encodeTicketExportRow,
};

export default Object.freeze({
  CSV_BOM,
  encodeCsvHeader,
  encodeTicketExportRow,
});
