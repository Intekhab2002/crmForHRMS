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
  SERVICE_TYPE: "service_type",
  DISTRICT: "district",
  TICKET_CATEGORY: "ticket_category",
  PROBLEM_STATEMENT: "problem_statement",
  CURRENT_BILL_STATUS: "current_bill_status",
  TICKET_STATUS: "ticket_status",
  TICKET_SEVERITY: "ticket_severity",
  TICKET_ISSUE_CATEGORY: "ticket_issue_category",
  TICKET_DEPENDENCY_CATEGORY: "ticket_dependency_category",
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

  DASHBOARD_READ: "dashboard:read",

  SERVICE_TYPE_READ: "service_type:read",
  SERVICE_TYPE_CREATE: "service_type:create",
  SERVICE_TYPE_UPDATE: "service_type:update",
  SERVICE_TYPE_DELETE: "service_type:delete",

  // Service Type
  SERVICE_TYPE_READ: "service_type:read",
  SERVICE_TYPE_CREATE: "service_type:create",
  SERVICE_TYPE_UPDATE: "service_type:update",
  SERVICE_TYPE_DELETE: "service_type:delete",

  // District
  DISTRICT_READ: "district:read",
  DISTRICT_CREATE: "district:create",
  DISTRICT_UPDATE: "district:update",
  DISTRICT_DELETE: "district:delete",

  // Ticket Category
  TICKET_CATEGORY_READ: "ticket_category:read",
  TICKET_CATEGORY_CREATE: "ticket_category:create",
  TICKET_CATEGORY_UPDATE: "ticket_category:update",
  TICKET_CATEGORY_DELETE: "ticket_category:delete",

  // Problem Statement
  PROBLEM_STATEMENT_READ: "problem_statement:read",
  PROBLEM_STATEMENT_CREATE: "problem_statement:create",
  PROBLEM_STATEMENT_UPDATE: "problem_statement:update",
  PROBLEM_STATEMENT_DELETE: "problem_statement:delete",

  // Current Bill Status
  CURRENT_BILL_STATUS_READ: "current_bill_status:read",
  CURRENT_BILL_STATUS_CREATE: "current_bill_status:create",
  CURRENT_BILL_STATUS_UPDATE: "current_bill_status:update",
  CURRENT_BILL_STATUS_DELETE: "current_bill_status:delete",

  // Ticket Status
  TICKET_STATUS_READ: "ticket_status:read",
  TICKET_STATUS_CREATE: "ticket_status:create",
  TICKET_STATUS_UPDATE: "ticket_status:update",
  TICKET_STATUS_DELETE: "ticket_status:delete",

  // Ticket Severity
  TICKET_SEVERITY_READ: "ticket_severity:read",
  TICKET_SEVERITY_CREATE: "ticket_severity:create",
  TICKET_SEVERITY_UPDATE: "ticket_severity:update",
  TICKET_SEVERITY_DELETE: "ticket_severity:delete",

  // Ticket Issue Category
  TICKET_ISSUE_CATEGORY_READ: "ticket_issue_category:read",
  TICKET_ISSUE_CATEGORY_CREATE: "ticket_issue_category:create",
  TICKET_ISSUE_CATEGORY_UPDATE: "ticket_issue_category:update",
  TICKET_ISSUE_CATEGORY_DELETE: "ticket_issue_category:delete",

  // Ticket Dependency Category
  TICKET_DEPENDENCY_CATEGORY_READ: "ticket_dependency_category:read",
  TICKET_DEPENDENCY_CATEGORY_CREATE: "ticket_dependency_category:create",
  TICKET_DEPENDENCY_CATEGORY_UPDATE: "ticket_dependency_category:update",
  TICKET_DEPENDENCY_CATEGORY_DELETE: "ticket_dependency_category:delete",
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
