/**
 * ============================================================================
 * CRM for HRMS
 * RBAC Constants
 * ============================================================================
 *
 * Purpose:
 *     Centralized authorization identifiers.
 *
 * IMPORTANT:
 *     Only developer and superadmin are fixed semantic role identities.
 *
 *     All other roles are dynamic application roles.
 *
 *     Role display names MUST NEVER be used for authorization.
 * ============================================================================
 */

/**
 * ============================================================================
 * Fixed System Identities
 * ============================================================================
 */

export const RBAC_ROLES = Object.freeze({
  DEVELOPER: "developer",
  SUPERADMIN: "superadmin",
});

/**
 * ============================================================================
 * Permission Resources
 * ============================================================================
 */

export const RBAC_RESOURCES = Object.freeze({
  USER: "user",
  ROLE: "role",
  PERMISSION: "permission",
  ORGANIZATION: "organization",
  DEPARTMENT: "department",
  TICKET: "ticket",
  SLA: "sla",
  DASHBOARD: "dashboard",
  EMPLOYEE: "employee",
  FORM_FIELD: "form_field",
  FORM_DEFINITION: "form_definition",
});

/**
 * ============================================================================
 * Permission Actions
 * ============================================================================
 */

export const RBAC_ACTIONS = Object.freeze({
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ASSIGN: "assign",
  RESOLVE: "resolve",
  CLOSE: "close",
  COMMENT: "comment",
  ATTACHMENT: "attachment",
  RESTORE: "restore",
  ENABLE: "enable",
  DISABLE: "disable",
});

/**
 * ============================================================================
 * Permission Codes
 * ============================================================================
 */

export const RBAC_PERMISSIONS = Object.freeze({
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  ROLE_READ: "role:read",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  PERMISSION_READ: "permission:read",
  PERMISSION_CREATE: "permission:create",
  PERMISSION_UPDATE: "permission:update",
  PERMISSION_DELETE: "permission:delete",

  ORGANIZATION_READ: "organization:read",
  ORGANIZATION_CREATE: "organization:create",
  ORGANIZATION_UPDATE: "organization:update",
  ORGANIZATION_DELETE: "organization:delete",

  DEPARTMENT_READ: "department:read",
  DEPARTMENT_CREATE: "department:create",
  DEPARTMENT_UPDATE: "department:update",
  DEPARTMENT_DELETE: "department:delete",

  TICKET_READ: "ticket:read",
  TICKET_CREATE: "ticket:create",
  TICKET_UPDATE: "ticket:update",
  TICKET_ASSIGN: "ticket:assign",
  TICKET_COMMENT: "ticket:comment",
  TICKET_RESOLVE: "ticket:resolve",
  TICKET_CLOSE: "ticket:close",
  TICKET_ATTACHMENT: "ticket:attachment",

  SLA_READ: "sla:read",
  SLA_CREATE: "sla:create",
  SLA_UPDATE: "sla:update",
  SLA_DELETE: "sla:delete",

  EMPLOYEE_READ: "employee:read",
  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_UPDATE: "employee:update",
  EMPLOYEE_DELETE: "employee:delete",

  DASHBOARD_READ: "dashboard:read",

  FORM_FIELD_READ: "form_field:read",
  FORM_FIELD_CREATE: "form_field:create",
  FORM_FIELD_UPDATE: "form_field:update",
  FORM_FIELD_DELETE: "form_field:delete",
  FORM_FIELD_RESTORE: "form_field:restore",
  FORM_FIELD_ENABLE: "form_field:enable",
  FORM_FIELD_DISABLE: "form_field:disable",

  FORM_DEFINITION_READ: "form_definition:read",
  FORM_DEFINITION_CREATE: "form_definition:create",
  FORM_DEFINITION_UPDATE: "form_definition:update",
  FORM_DEFINITION_DELETE: "form_definition:delete",
});

/**
 * ============================================================================
 * Authorization Error Codes
 * ============================================================================
 */

export const RBAC_ERROR_CODES = Object.freeze({
  PERMISSION_REQUIRED: "RBAC_PERMISSION_REQUIRED",
  ROLE_REQUIRED: "RBAC_ROLE_REQUIRED",
  ACCESS_DENIED: "RBAC_ACCESS_DENIED",
  USER_NOT_FOUND: "RBAC_USER_NOT_FOUND",

  DEVELOPER_PROTECTED: "RBAC_DEVELOPER_PROTECTED",
  SUPERADMIN_PROTECTED: "RBAC_SUPERADMIN_PROTECTED",
  SYSTEM_ROLE_PROTECTED: "RBAC_SYSTEM_ROLE_PROTECTED",

  AUTHORITY_VIOLATION: "RBAC_AUTHORITY_VIOLATION",
  SELF_ROLE_MODIFICATION: "RBAC_SELF_ROLE_MODIFICATION",
  SELF_ROLE_ASSIGNMENT: "RBAC_SELF_ROLE_ASSIGNMENT",
  SYSTEM_ROLE_ASSIGNMENT: "RBAC_SYSTEM_ROLE_ASSIGNMENT",
  PERMISSION_MANAGEMENT_REQUIRED: "RBAC_PERMISSION_MANAGEMENT_REQUIRED",

  ROLE_MANAGEMENT_REQUIRED: "RBAC_ROLE_MANAGEMENT_REQUIRED",

  USER_MANAGEMENT_REQUIRED: "RBAC_USER_MANAGEMENT_REQUIRED",
});

/**
 * ============================================================================
 * Authorization Success Codes
 * ============================================================================
 */

export const RBAC_SUCCESS_CODES = Object.freeze({
  AUTHORIZATION_GRANTED: "RBAC_AUTHORIZATION_GRANTED",
});

const rbacConstants = Object.freeze({
  RBAC_ROLES,
  RBAC_RESOURCES,
  RBAC_ACTIONS,
  RBAC_PERMISSIONS,
  RBAC_ERROR_CODES,
  RBAC_SUCCESS_CODES,
});

export default rbacConstants;
