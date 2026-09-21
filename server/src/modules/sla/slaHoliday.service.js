import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import calendarService from "./slaCalendar.service.js";
import { SLA_ERROR_CODES } from "./sla.constants.js";
import { getQueryExecutor } from "../../database/queryExecutor.js";
import { parseHolidayWorkbook } from "./slaHoliday.excel.js";

async function requireHoliday(id, tx = null) {
  const item = await repository.oneHoliday(id, tx);
  if (!item)
    throw AppError.notFound("SLA holiday not found.", {
      code: SLA_ERROR_CODES.HOLIDAY_NOT_FOUND,
    });
  return item;
}
async function list(calendarId, o = {}) {
  await calendarService.requireCalendar(calendarId);
  return repository.listHolidays(calendarId, o);
}
async function create(calendarId, data) {
  await calendarService.requireCalendar(calendarId);
  return repository.createHoliday({
    ...data,
    calendarId,
    name: data.name.trim(),
  });
}
async function update(id, data) {
  await requireHoliday(id);
  return repository.updateHoliday(id, { ...data, name: data.name?.trim() });
}
async function remove(id) {
  await requireHoliday(id);
  return repository.updateHoliday(id, { isActive: false });
}
async function importExcel(calendarId, year, file) {
  if (!file?.buffer) {
    throw AppError.badRequest(
      "An Excel file is required.",
      {
        code: "SLA_HOLIDAY_IMPORT_FILE_REQUIRED",
      },
    );
  }

  await calendarService.requireCalendar(calendarId);

  const rows = await parseHolidayWorkbook(
    file.buffer,
    year,
  );

  return repository.importHolidays(
    calendarId,
    rows,
  );
}
export default Object.freeze({ list, create, update, remove, requireHoliday,importExcel });
