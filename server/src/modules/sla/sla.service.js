import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import policyService from "./slaPolicy.service.js";
import calendarService from "./slaCalendar.service.js";
import holidayService from "./slaHoliday.service.js";
import engine from "./slaEngine.service.js";
import ticketSla from "./ticketSla.service.js";
import { SLA_ERROR_CODES } from "./sla.constants.js";

async function ticket(id) {
  const x = await repository.oneTicket(id);
  if (!x)
    throw AppError.notFound("Ticket not found.", {
      code: SLA_ERROR_CODES.TICKET_NOT_FOUND,
    });
  return x;
}
async function getTicketSla(id) {
  return ticketSla.get(id);
}
async function getHistory(id) {
  return ticketSla.history(id);
}
async function recalculate(id) {
  await ticket(id);
  return engine.syncTicket(id);
}
async function preview(d) {
  const c = await calendarService.requireCalendar(d.calendarId);
  const h = await repository.listHolidays(c.id, {});
  return engine.preview({
    startAt: d.startAt,
    durationMinutes: d.durationMinutes,
    calendar: c,
    holidays: h,
  });
}

async function createRule(policyId, data) {
  await policyService.requirePolicy(policyId);
  return repository.createRule({
    ...data,
    policyId,
    fieldValueKey: String(data.fieldValueKey).trim().toLowerCase(),
  });
}

async function updateRule(ruleId, data) {
  const existing = await repository.findRule(ruleId);
  if (!existing)
    throw AppError.notFound("SLA rule not found.", {
      code: SLA_ERROR_CODES.RULE_NOT_FOUND,
    });
  const normalized = {
    ...data,
  };

  if (Object.hasOwn(data, "fieldValueKey")) {
    normalized.fieldValueKey = String(data.fieldValueKey).trim().toLowerCase();
  }
  return repository.updateRule(ruleId, data);
}
async function deleteRule(ruleId) {
  return updateRule(ruleId, { isEnabled: false });
}
async function maintenance(limit = 500) {
  const rows = await repository.runningSlas(limit),
    results = [];
  for (const row of rows) {
    try {
      const x = await engine.syncTicket(row.ticket_id);
      results.push({
        ticketId: row.ticket_id,
        status: x?.status ?? null,
        success: true,
      });
    } catch (error) {
      results.push({
        ticketId: row.ticket_id,
        success: false,
        error: error.message,
      });
    }
  }
  return results;
}
export default Object.freeze({
  getTicketSla,
  getHistory,
  recalculate,
  preview,
  maintenance,
  createRule,
  updateRule,
  deleteRule,
  policy: policyService,
  calendar: calendarService,
  holiday: holidayService,
});
