/**
 * CRM for HRMS
 *
 * Client permission vocabulary.
 *
 * IMPORTANT:
 * These are permission CODES, not role names.
 *
 * Role names are dynamic and must never be used
 * for client-side authorization decisions.
 */

export const PERMISSIONS = Object.freeze({
  DASHBOARD_READ: "dashboard:read",

  USER_READ: "user:read",

  USER_CREATE: "user:create",

  USER_UPDATE: "user:update",

  USER_DELETE: "user:delete",

  ROLE_READ: "role:read",

  ROLE_CREATE: "role:create",

  ROLE_UPDATE: "role:update",

  ROLE_DELETE: "role:delete",

  TICKET_READ: "ticket:read",

  TICKET_CREATE: "ticket:create",

  TICKET_UPDATE: "ticket:update",

  TICKET_DELETE: "ticket:delete",

  TICKET_ATTACHMENT: "ticket:attachment",

  OPTION_READ: "option:read",

  OPTION_CREATE: "option:create",

  OPTION_UPDATE: "option:update",

  OPTION_DELETE: "option:delete",

  SLA_READ: "sla:read",
  SLA_CREATE: "sla:create",
  SLA_UPDATE: "sla:update",
  SLA_DELETE: "sla:delete",
  SLA_ACTIVATE: "sla:activate",
  SLA_CALENDAR_READ: "sla:calendar_read",
  SLA_CALENDAR_CREATE: "sla:calendar_create",
  SLA_CALENDAR_UPDATE: "sla:calendar_update",
  SLA_CALENDAR_DELETE: "sla:calendar_delete",
  SLA_HOLIDAY_READ: "sla:holiday_read",
  SLA_HOLIDAY_CREATE: "sla:holiday_create",
  SLA_HOLIDAY_UPDATE: "sla:holiday_update",
  SLA_HOLIDAY_DELETE: "sla:holiday_delete",
  SLA_RECALCULATE: "sla:recalculate",
});

export default PERMISSIONS;

const PERMISSION_RESOURCE_CONFIG = Object.freeze({
  user: Object.freeze({
    label: "Users",
  }),

  role: Object.freeze({
    label: "Roles",
  }),

  permission: Object.freeze({
    label: "Permissions",
  }),

  ticket: Object.freeze({
    label: "Tickets",
  }),

  contact: Object.freeze({
    label: "Contacts",
  }),

  dashboard: Object.freeze({
    label: "Dashboard",
  }),

  sla: Object.freeze({
    label: "SLA",
  }),

  report: Object.freeze({
    label: "Reports",
  }),
});

export { PERMISSION_RESOURCE_CONFIG };
