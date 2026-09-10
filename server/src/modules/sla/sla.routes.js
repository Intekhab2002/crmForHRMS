import { Router } from "express";
import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";
import controller from "./sla.controller.js";
import v from "./sla.validator.js";

const router = Router(),
  { authenticate } = authMiddleware,
  { requirePermission } = rbacMiddleware;
const body = (s) => (req, res, next) => {
  try {
    req.body = s.parse(req.body);
    next();
  } catch (e) {
    next(e);
  }
};
const params = (s) => (req, res, next) => {
  try {
    req.params = s.parse(req.params);
    next();
  } catch (e) {
    next(e);
  }
};
const query = (s) => (req, res, next) => {
  try {
    req.validatedQuery = s.parse(req.query);
    next();
  } catch (e) {
    next(e);
  }
};

router.get(
  "/policies",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_READ),
  query(v.listQuerySchema),
  controller.policies,
);
router.get(
  "/policies/:id",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_READ),
  params(v.uuidParamSchema),
  controller.policy,
);
router.post(
  "/policies",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CREATE),
  body(v.createPolicySchema),
  controller.createPolicy,
);
router.patch(
  "/policies/:id",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_UPDATE),
  params(v.uuidParamSchema),
  body(v.updatePolicySchema),
  controller.updatePolicy,
);
router.post(
  "/policies/:id/activate",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_ACTIVATE),
  params(v.uuidParamSchema),
  controller.activatePolicy,
);
router.post(
  "/policies/:id/deactivate",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_ACTIVATE),
  params(v.uuidParamSchema),
  controller.deactivatePolicy,
);
router.post(
  "/policies/:policyId/rules",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_UPDATE),
  params(v.policyParamSchema),
  body(v.createRuleSchema),
  controller.createRule,
);
router.post(
  "/policies/:policyId/rules",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_UPDATE),
  params(v.uuidParamSchema),
  body(v.createRuleSchema),
  controller.createRule,
);
router.patch(
  "/policies/:policyId/rules/:ruleId",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_UPDATE),
  params(v.policyRuleParamSchema),
  body(v.updateRuleSchema),
  controller.updateRule,
);
router.delete(
  "/policies/:policyId/rules/:ruleId",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_DELETE),
  params(v.policyRuleParamSchema),
  controller.deleteRule,
);

router.get(
  "/calendars",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CALENDAR_READ),
  query(v.listQuerySchema),
  controller.calendars,
);
router.get(
  "/calendars/:id",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CALENDAR_READ),
  params(v.uuidParamSchema),
  controller.calendar,
);
router.post(
  "/calendars",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CALENDAR_CREATE),
  body(v.createCalendarSchema),
  controller.createCalendar,
);
router.patch(
  "/calendars/:id",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CALENDAR_UPDATE),
  params(v.uuidParamSchema),
  body(v.updateCalendarSchema),
  controller.updateCalendar,
);
router.post(
  "/calendars/:id/activate",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CALENDAR_UPDATE),
  params(v.uuidParamSchema),
  controller.activateCalendar,
);
router.post(
  "/calendars/:id/deactivate",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_CALENDAR_UPDATE),
  params(v.uuidParamSchema),
  controller.deactivateCalendar,
);

router.get(
  "/calendars/:calendarId/holidays",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_HOLIDAY_READ),
  params(v.calendarParamSchema),
  query(v.holidayListQuerySchema),
  controller.holidays,
);
router.post(
  "/calendars/:calendarId/holidays",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_HOLIDAY_CREATE),
  params(v.calendarParamSchema),
  body(v.createHolidaySchema),
  controller.createHoliday,
);
router.patch(
  "/calendars/:calendarId/holidays/:holidayId",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_HOLIDAY_UPDATE),
  params(v.calendarHolidayParamSchema),
  body(v.updateHolidaySchema),
  controller.updateHoliday,
);
router.delete(
  "/calendars/:calendarId/holidays/:holidayId",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_HOLIDAY_DELETE),
  params(v.calendarHolidayParamSchema),
  controller.deleteHoliday,
);

router.post(
  "/preview",
  authenticate,
  requirePermission(RBAC_PERMISSIONS.SLA_READ),
  body(v.previewSchema),
  controller.preview,
);
export default router;
