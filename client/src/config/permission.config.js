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
});

export default PERMISSIONS;
