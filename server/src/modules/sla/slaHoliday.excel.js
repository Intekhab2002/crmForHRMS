import ExcelJS from "exceljs";
import AppError from "../../helpers/AppError.js";

const REQUIRED_HEADERS = ["Date", "Holiday Name"];

function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseExcelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);

    if (!Number.isNaN(date.getTime())) {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      };
    }
  }

  const raw = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toIsoDate(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

function rowValue(row, columnNumber) {
  return row.getCell(columnNumber).value;
}

export async function createHolidayTemplate(year) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CRM for HRMS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Holidays");
  const instructions = workbook.addWorksheet("Instructions");

  sheet.columns = [
    {
      header: "Date",
      key: "date",
      width: 16,
    },
    {
      header: "Holiday Name",
      key: "name",
      width: 40,
    },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.freezePanes = { ySplit: 1 };
  sheet.autoFilter = "A1:B1";

  // Keep the import sheet empty except for headers. The user can safely
  // upload an untouched template without accidentally creating sample data.
  sheet.addRow({ date: "", name: "" });

  instructions.columns = [
    { width: 100 },
  ];

  instructions.getCell("A1").value = `SLA Holiday Import — ${year}`;
  instructions.getCell("A1").font = { bold: true, size: 14 };

  [
    "1. Enter dates using YYYY-MM-DD.",
    "2. Holiday Name is required and must not exceed 200 characters.",
    `3. Every date must belong to ${year}.`,
    "4. Do not duplicate a date in the workbook.",
    "5. Import creates new holidays and updates existing holidays for the same calendar/date.",
    "6. Holidays omitted from the workbook are not deleted.",
    "7. Do not rename the Date or Holiday Name columns.",
  ].forEach((text, index) => {
    instructions.getCell(`A${index + 3}`).value = text;
  });

  return workbook.xlsx.writeBuffer();
}

export async function parseHolidayWorkbook(buffer, expectedYear) {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw AppError.badRequest("The uploaded file is not a valid .xlsx workbook.", {
      code: "SLA_HOLIDAY_IMPORT_INVALID_WORKBOOK",
    });
  }

  const sheet = workbook.getWorksheet("Holidays") ?? workbook.worksheets[0];

  if (!sheet) {
    throw AppError.badRequest("The workbook does not contain a worksheet.", {
      code: "SLA_HOLIDAY_IMPORT_NO_WORKSHEET",
    });
  }

  const headerMap = new Map();

  sheet.getRow(1).eachCell((cell, columnNumber) => {
    headerMap.set(normalizeHeader(cell.value), columnNumber);
  });

  const dateColumn = headerMap.get(normalizeHeader(REQUIRED_HEADERS[0]));
  const nameColumn = headerMap.get(normalizeHeader(REQUIRED_HEADERS[1]));

  if (!dateColumn || !nameColumn) {
    throw AppError.badRequest(
      'The "Holidays" sheet must contain "Date" and "Holiday Name" columns.',
      {
        code: "SLA_HOLIDAY_IMPORT_INVALID_HEADERS",
      },
    );
  }

  const errors = [];
  const rows = [];
  const seenDates = new Set();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const rawDate = rowValue(row, dateColumn);
    const rawName = rowValue(row, nameColumn);

    const isEmptyRow =
      (rawDate === null || rawDate === undefined || rawDate === "") &&
      (rawName === null || rawName === undefined || rawName === "");

    if (isEmptyRow) {
      return;
    }

    const parsedDate = parseExcelDate(rawDate);
    const name = String(rawName ?? "").trim();

    if (!parsedDate) {
      errors.push({
        row: rowNumber,
        field: "Date",
        message: "Date must be a valid date in YYYY-MM-DD format.",
      });
      return;
    }

    if (parsedDate.year !== expectedYear) {
      errors.push({
        row: rowNumber,
        field: "Date",
        message: `Date must belong to ${expectedYear}.`,
      });
    }

    if (!name) {
      errors.push({
        row: rowNumber,
        field: "Holiday Name",
        message: "Holiday name is required.",
      });
    } else if (name.length > 200) {
      errors.push({
        row: rowNumber,
        field: "Holiday Name",
        message: "Holiday name must not exceed 200 characters.",
      });
    }

    const holidayDate = toIsoDate(parsedDate);

    if (seenDates.has(holidayDate)) {
      errors.push({
        row: rowNumber,
        field: "Date",
        message: `Duplicate holiday date: ${holidayDate}.`,
      });
    }

    seenDates.add(holidayDate);

    rows.push({
      holidayDate,
      name,
      isActive: true,
    });
  });

  if (errors.length > 0) {
    throw AppError.badRequest("Holiday import validation failed.", {
      code: "SLA_HOLIDAY_IMPORT_VALIDATION_FAILED",
      errors,
    });
  }

  return rows;
}
