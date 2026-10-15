import { TICKET_EXPORT_COLUMNS } from "./ticketExport.constants.js";

const CSV_BOM = "\uFEFF";


const DATETIME_COLUMN_KEYS = new Set([
  "assignedAt",
  "resolvedAt",
  "closedAt",
  "createdAt",
  "updatedAt",
]);

function formatDateTime(value, timezone = "Asia/Kolkata") {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const part = (type) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("day")} ${part("month")} ${part("year")}, ${part("hour")}:${part("minute")}:${part("second")} ${part("dayPeriod").toUpperCase()}`;
}

function normalizeCsvValue(value, key, timezone) {
  if (value === null || value === undefined) {
    return "";
  }

  if (DATETIME_COLUMN_KEYS.has(key)) {
    return formatDateTime(value, timezone);
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

function escapeCsvValue(value, key, timezone) {
  const normalized = protectSpreadsheetFormula(
    normalizeCsvValue(value, key, timezone),
  );

  if (!/[",\r\n\t]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

function encodeCsvRow(row) {
  return `${row.map((value) => escapeCsvValue(value)).join(",")}\r\n`;
}

function encodeCsvHeader() {
  return encodeCsvRow(
    TICKET_EXPORT_COLUMNS.map((column) => column.header),
  );
}

function encodeTicketExportRow(mappedRow, timezone = "Asia/Kolkata") {
  return `${TICKET_EXPORT_COLUMNS.map((column) =>
    escapeCsvValue(mappedRow[column.key], column.key, timezone),
  ).join(",")}\r\n`;
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
