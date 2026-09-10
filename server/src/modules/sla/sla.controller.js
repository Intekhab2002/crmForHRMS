import { ApiResponse } from "../../helpers/ApiResponse.js";
import service from "./sla.service.js";
import repository from "./sla.repository.js";

const pageMeta = (q, total) => {
  const totalPages = Math.ceil(total / q.limit);
  return {
    page: q.page,
    limit: q.limit,
    total,
    totalPages,
    hasNextPage: q.page < totalPages,
    hasPreviousPage: q.page > 1,
  };
};

async function policies(req, res, next) {
  try {
    const x = await service.policy.list(req.validatedQuery);
    return ApiResponse.paginated(
      res,
      x.rows,
      pageMeta(req.validatedQuery, x.total),
      "SLA policies retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function policy(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.policy.getById(req.params.id),
      "SLA policy retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function createPolicy(req, res, next) {
  try {
    return ApiResponse.created(
      res,
      await service.policy.create(req.body, req.auth.userId),
      "SLA policy created successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function updatePolicy(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.policy.update(req.params.id, req.body, req.auth.userId),
      "SLA policy updated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function activatePolicy(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.policy.setActive(req.params.id, true, req.auth.userId),
      "SLA policy activated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function deactivatePolicy(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.policy.setActive(req.params.id, false, req.auth.userId),
      "SLA policy deactivated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function rules(req, res, next) {
  try {
    const { policyId } = req.params;

    await service.policy.requirePolicy(policyId);

    return ApiResponse.success(
      res,
      await repository.listRules(policyId),
      "SLA policy rules retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function createRule(req, res, next) {
  try {
    return ApiResponse.created(
      res,
      await service.createRule(req.params.policyId, req.body),
      "SLA rule created successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function updateRule(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.updateRule(req.params.ruleId, req.body),
      "SLA rule updated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function deleteRule(req, res, next) {
  try {
    return ApiResponse.deleted(
      res,
      await service.deleteRule(req.params.ruleId),
      "SLA rule deactivated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function calendars(req, res, next) {
  try {
    const x = await service.calendar.list(req.validatedQuery);
    return ApiResponse.paginated(
      res,
      x.rows,
      pageMeta(req.validatedQuery, x.total),
      "SLA calendars retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function calendar(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.calendar.getById(req.params.id),
      "SLA calendar retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function createCalendar(req, res, next) {
  try {
    return ApiResponse.created(
      res,
      await service.calendar.create(req.body),
      "SLA calendar created successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function updateCalendar(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.calendar.update(req.params.id, req.body),
      "SLA calendar updated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function activateCalendar(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.calendar.setActive(req.params.id, true),
      "SLA calendar activated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function deactivateCalendar(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.calendar.setActive(req.params.id, false),
      "SLA calendar deactivated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function holidays(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.holiday.list(req.params.calendarId, req.validatedQuery),
      "SLA holidays retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function createHoliday(req, res, next) {
  try {
    return ApiResponse.created(
      res,
      await service.holiday.create(req.params.calendarId, req.body),
      "SLA holiday created successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function updateHoliday(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.holiday.update(req.params.holidayId, req.body),
      "SLA holiday updated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function deleteHoliday(req, res, next) {
  try {
    return ApiResponse.deleted(
      res,
      await service.holiday.remove(req.params.holidayId),
      "SLA holiday deactivated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function ticketSla(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.getTicketSla(req.params.ticketId),
      "Ticket SLA retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function history(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.getHistory(req.params.ticketId),
      "Ticket SLA history retrieved successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function recalc(req, res, next) {
  try {
    return ApiResponse.updated(
      res,
      await service.recalculate(req.params.ticketId),
      "Ticket SLA recalculated successfully.",
    );
  } catch (e) {
    next(e);
  }
}
async function preview(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.preview(req.body),
      "SLA preview calculated successfully.",
    );
  } catch (e) {
    next(e);
  }
}

export default Object.freeze({
  policies,
  policy,
  createPolicy,
  updatePolicy,
  activatePolicy,
  deactivatePolicy,
  rules,
  createRule,
  updateRule,
  deleteRule,
  calendars,
  calendar,
  createCalendar,
  updateCalendar,
  activateCalendar,
  deactivateCalendar,
  holidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  ticketSla,
  history,
  recalc,
  preview,
});
