/**
 * ============================================================================
 * CRM for HRMS
 * Initial RBAC Bootstrap Seeder
 * ============================================================================
 *
 * File:
 *     server/seeders/001_bootstrap_rbac.js
 *
 * Purpose:
 *     Bootstrap the minimum RBAC data required by the CRM for HRMS
 *     application.
 *
 * Initial system state:
 *
 *     Roles:
 *         - developer
 *         - superadmin
 *
 *     Users:
 *         - exactly one Developer bootstrap user
 *
 *     Super Admin users:
 *         - none
 *
 *     Permissions:
 *         - complete system permission catalog
 *
 *     Role permissions:
 *         - Developer receives every system permission.
 *         - Super Admin receives normal application permissions.
 *
 * IMPORTANT:
 *
 *     Only Developer and Super Admin are fixed semantic roles.
 *
 *     The following roles MUST NOT be created by this seeder:
 *
 *         admin
 *         manager
 *         agent
 *         customer
 *
 *     Those are normal/custom roles and must be created through the
 *     application role-management workflow.
 *
 * Characteristics:
 *     - Idempotent.
 *     - Transactional.
 *     - Production-safe.
 *     - Does not reset existing passwords.
 *     - Does not create duplicate users.
 *     - Does not create operational roles.
 *     - Does not delete application data.
 *
 * ============================================================================
 */

import { randomUUID } from "node:crypto";

import appConfig from "../src/config/app.config.js";
import database from "../src/database/postgres.js";
import { executeTransaction } from "../src/database/transaction.js";
import { getQueryExecutor } from "../src/database/queryExecutor.js";
import passwordService from "../src/modules/auth/auth.password.js";
import authConstants from "../src/modules/auth/auth.constants.js";
import logger from "../src/config/logger.js";

const { AUTH_ACCOUNT_STATUS } = authConstants;

/**
 * ============================================================================
 * Fixed System Roles
 * ============================================================================
 *
 * These are the ONLY roles created by the bootstrap seeder.
 *
 * Their semantic codes are immutable.
 *
 * Display names are also protected by the database because these two roles
 * represent fixed system identities.
 */

const SYSTEM_ROLES = Object.freeze([
  Object.freeze({
    code: "developer",
    name: "Developer",
    description:
      "Protected highest-authority system role used for system administration, bootstrap and recovery.",
  }),

  Object.freeze({
    code: "superadmin",
    name: "Super Administrator",
    description:
      "Protected application administrator role managed by the Developer.",
  }),
]);

/**
 * ============================================================================
 * System Permissions
 * ============================================================================
 *
 * Permission codes are stable machine-readable authorization identifiers.
 *
 * Do NOT use role names in authorization logic.
 */

const SYSTEM_PERMISSIONS = Object.freeze([
  // -------------------------------------------------------------------------
  // User Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "user:read",
    name: "Read Users",
    description: "View user records.",
    resource: "user",
    action: "read",
  }),

  Object.freeze({
    code: "user:create",
    name: "Create Users",
    description: "Create new users.",
    resource: "user",
    action: "create",
  }),

  Object.freeze({
    code: "user:update",
    name: "Update Users",
    description: "Update existing users.",
    resource: "user",
    action: "update",
  }),

  Object.freeze({
    code: "user:delete",
    name: "Delete Users",
    description: "Delete users where permitted by business rules.",
    resource: "user",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Role Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "role:read",
    name: "Read Roles",
    description: "View roles.",
    resource: "role",
    action: "read",
  }),

  Object.freeze({
    code: "role:create",
    name: "Create Roles",
    description: "Create normal application roles.",
    resource: "role",
    action: "create",
  }),

  Object.freeze({
    code: "role:update",
    name: "Update Roles",
    description: "Update normal application roles.",
    resource: "role",
    action: "update",
  }),

  Object.freeze({
    code: "role:delete",
    name: "Delete Roles",
    description: "Delete normal application roles where permitted.",
    resource: "role",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Permission Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "permission:read",
    name: "Read Permissions",
    description: "View permissions.",
    resource: "permission",
    action: "read",
  }),

  Object.freeze({
    code: "permission:create",
    name: "Create Permissions",
    description: "Create application permissions where permitted.",
    resource: "permission",
    action: "create",
  }),

  Object.freeze({
    code: "permission:update",
    name: "Update Permissions",
    description: "Update application permissions where permitted.",
    resource: "permission",
    action: "update",
  }),

  Object.freeze({
    code: "permission:delete",
    name: "Delete Permissions",
    description: "Delete application permissions where permitted.",
    resource: "permission",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Organization Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "organization:read",
    name: "Read Organizations",
    description: "View organization records.",
    resource: "organization",
    action: "read",
  }),

  Object.freeze({
    code: "organization:create",
    name: "Create Organizations",
    description: "Create organizations.",
    resource: "organization",
    action: "create",
  }),

  Object.freeze({
    code: "organization:update",
    name: "Update Organizations",
    description: "Update organization records.",
    resource: "organization",
    action: "update",
  }),

  Object.freeze({
    code: "organization:delete",
    name: "Delete Organizations",
    description: "Deactivate organizations where permitted.",
    resource: "organization",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Department Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "department:read",
    name: "Read Departments",
    description: "View department records.",
    resource: "department",
    action: "read",
  }),

  Object.freeze({
    code: "department:create",
    name: "Create Departments",
    description: "Create departments.",
    resource: "department",
    action: "create",
  }),

  Object.freeze({
    code: "department:update",
    name: "Update Departments",
    description: "Update department records.",
    resource: "department",
    action: "update",
  }),

  Object.freeze({
    code: "department:delete",
    name: "Delete Departments",
    description: "Deactivate departments where permitted.",
    resource: "department",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Employee Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "employee:read",
    name: "Read Employees",
    description: "View employee records.",
    resource: "employee",
    action: "read",
  }),

  Object.freeze({
    code: "employee:create",
    name: "Create Employees",
    description: "Create employee records.",
    resource: "employee",
    action: "create",
  }),

  Object.freeze({
    code: "employee:update",
    name: "Update Employees",
    description: "Update employee records.",
    resource: "employee",
    action: "update",
  }),

  Object.freeze({
    code: "employee:delete",
    name: "Delete Employees",
    description: "Deactivate employee records.",
    resource: "employee",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Ticket Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "ticket:read",
    name: "Read Tickets",
    description: "View tickets.",
    resource: "ticket",
    action: "read",
  }),

  Object.freeze({
    code: "ticket:create",
    name: "Create Tickets",
    description: "Create tickets.",
    resource: "ticket",
    action: "create",
  }),

  Object.freeze({
    code: "ticket:update",
    name: "Update Tickets",
    description: "Update tickets.",
    resource: "ticket",
    action: "update",
  }),

  Object.freeze({
    code: "ticket:assign",
    name: "Assign Tickets",
    description: "Assign and reassign tickets.",
    resource: "ticket",
    action: "assign",
  }),

  Object.freeze({
    code: "ticket:comment",
    name: "Comment on Tickets",
    description: "Add comments to tickets.",
    resource: "ticket",
    action: "comment",
  }),

  Object.freeze({
    code: "ticket:attachment",
    name: "Manage Ticket Attachments",
    description: "Upload, view, download, and delete ticket attachments.",
    resource: "ticket",
    action: "attachment",
  }),

  Object.freeze({
    code: "ticket:resolve",
    name: "Resolve Tickets",
    description: "Resolve tickets.",
    resource: "ticket",
    action: "resolve",
  }),

  Object.freeze({
    code: "ticket:close",
    name: "Close Tickets",
    description: "Close tickets.",
    resource: "ticket",
    action: "close",
  }),

  // {
  //   code: "attachment:read",
  //   name: "Read Attachments",
  //   description: "View and download attachments.",
  //   resource: "attachment",
  //   action: "read",
  // },

  // {
  //   code: "attachment:create",
  //   name: "Create Attachments",
  //   description: "Upload attachments.",
  //   resource: "attachment",
  //   action: "create",
  // },

  // {
  //   code: "attachment:update",
  //   name: "Update Attachments",
  //   description: "Update attachment metadata where permitted.",
  //   resource: "attachment",
  //   action: "update",
  // },

  // {
  //   code: "attachment:delete",
  //   name: "Delete Attachments",
  //   description: "Delete attachments where permitted.",
  //   resource: "attachment",
  //   action: "delete",
  // },

  // -------------------------------------------------------------------------
  // Ticket Comments
  // -------------------------------------------------------------------------

  // Object.freeze({
  //   code: "comment:read",
  //   name: "Read Comments",
  //   description: "View ticket comments.",
  //   resource: "comment",
  //   action: "read",
  // }),

  // Object.freeze({
  //   code: "comment:create",
  //   name: "Create Comments",
  //   description: "Add comments to tickets.",
  //   resource: "comment",
  //   action: "create",
  // }),

  // Object.freeze({
  //   code: "comment:update",
  //   name: "Update Comments",
  //   description: "Update comments where permitted.",
  //   resource: "comment",
  //   action: "update",
  // }),

  // Object.freeze({
  //   code: "comment:delete",
  //   name: "Delete Comments",
  //   description: "Delete comments where permitted.",
  //   resource: "comment",
  //   action: "delete",
  // }),

  // -------------------------------------------------------------------------
  // SLA Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "sla:read",
    name: "Read SLA",
    description: "View SLA configuration and information.",
    resource: "sla",
    action: "read",
  }),

  Object.freeze({
    code: "sla:create",
    name: "Create SLA",
    description: "Create SLA policies.",
    resource: "sla",
    action: "create",
  }),

  Object.freeze({
    code: "sla:update",
    name: "Update SLA",
    description: "Update SLA policies.",
    resource: "sla",
    action: "update",
  }),

  Object.freeze({
    code: "sla:delete",
    name: "Delete SLA",
    description: "Delete SLA policies where permitted.",
    resource: "sla",
    action: "delete",
  }),

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "dashboard:read",
    name: "Read Dashboard",
    description: "View role-authorized dashboards.",
    resource: "dashboard",
    action: "read",
  }),

  // Service Type
  Object.freeze({
    code: "service_type:read",
    name: "Read Service Type",
    description: "View service type configuration and information.",
    resource: "service_type",
    action: "read",
  }),
  Object.freeze({
    code: "service_type:create",
    name: "Create Service Type",
    description: "Create service type entries.",
    resource: "service_type",
    action: "create",
  }),
  Object.freeze({
    code: "service_type:update",
    name: "Update Service Type",
    description: "Update service type entries.",
    resource: "service_type",
    action: "update",
  }),
  Object.freeze({
    code: "service_type:delete",
    name: "Delete Service Type",
    description: "Delete service type entries where permitted.",
    resource: "service_type",
    action: "delete",
  }),

  // District
  Object.freeze({
    code: "district:read",
    name: "Read District",
    description: "View district configuration and information.",
    resource: "district",
    action: "read",
  }),
  Object.freeze({
    code: "district:create",
    name: "Create District",
    description: "Create district entries.",
    resource: "district",
    action: "create",
  }),
  Object.freeze({
    code: "district:update",
    name: "Update District",
    description: "Update district entries.",
    resource: "district",
    action: "update",
  }),
  Object.freeze({
    code: "district:delete",
    name: "Delete District",
    description: "Delete district entries where permitted.",
    resource: "district",
    action: "delete",
  }),

  // Ticket Category
  Object.freeze({
    code: "ticket_category:read",
    name: "Read Ticket Category",
    description: "View ticket category configuration and information.",
    resource: "ticket_category",
    action: "read",
  }),
  Object.freeze({
    code: "ticket_category:create",
    name: "Create Ticket Category",
    description: "Create ticket categories.",
    resource: "ticket_category",
    action: "create",
  }),
  Object.freeze({
    code: "ticket_category:update",
    name: "Update Ticket Category",
    description: "Update ticket categories.",
    resource: "ticket_category",
    action: "update",
  }),
  Object.freeze({
    code: "ticket_category:delete",
    name: "Delete Ticket Category",
    description: "Delete ticket categories where permitted.",
    resource: "ticket_category",
    action: "delete",
  }),

  // Problem Statement
  Object.freeze({
    code: "problem_statement:read",
    name: "Read Problem Statement",
    description: "View problem statement configuration and information.",
    resource: "problem_statement",
    action: "read",
  }),
  Object.freeze({
    code: "problem_statement:create",
    name: "Create Problem Statement",
    description: "Create problem statements.",
    resource: "problem_statement",
    action: "create",
  }),
  Object.freeze({
    code: "problem_statement:update",
    name: "Update Problem Statement",
    description: "Update problem statements.",
    resource: "problem_statement",
    action: "update",
  }),
  Object.freeze({
    code: "problem_statement:delete",
    name: "Delete Problem Statement",
    description: "Delete problem statements where permitted.",
    resource: "problem_statement",
    action: "delete",
  }),

  // Current Bill Status
  Object.freeze({
    code: "current_bill_status:read",
    name: "Read Current Bill Status",
    description: "View current bill status configuration and information.",
    resource: "current_bill_status",
    action: "read",
  }),
  Object.freeze({
    code: "current_bill_status:create",
    name: "Create Current Bill Status",
    description: "Create current bill status entries.",
    resource: "current_bill_status",
    action: "create",
  }),
  Object.freeze({
    code: "current_bill_status:update",
    name: "Update Current Bill Status",
    description: "Update current bill status entries.",
    resource: "current_bill_status",
    action: "update",
  }),
  Object.freeze({
    code: "current_bill_status:delete",
    name: "Delete Current Bill Status",
    description: "Delete current bill status entries where permitted.",
    resource: "current_bill_status",
    action: "delete",
  }),

  // Ticket Status
  Object.freeze({
    code: "ticket_status:read",
    name: "Read Ticket Status",
    description: "View ticket status configuration and information.",
    resource: "ticket_status",
    action: "read",
  }),
  Object.freeze({
    code: "ticket_status:create",
    name: "Create Ticket Status",
    description: "Create ticket statuses.",
    resource: "ticket_status",
    action: "create",
  }),
  Object.freeze({
    code: "ticket_status:update",
    name: "Update Ticket Status",
    description: "Update ticket statuses.",
    resource: "ticket_status",
    action: "update",
  }),
  Object.freeze({
    code: "ticket_status:delete",
    name: "Delete Ticket Status",
    description: "Delete ticket statuses where permitted.",
    resource: "ticket_status",
    action: "delete",
  }),

  // Ticket Severity
  Object.freeze({
    code: "ticket_severity:read",
    name: "Read Ticket Severity",
    description: "View ticket severity configuration and information.",
    resource: "ticket_severity",
    action: "read",
  }),
  Object.freeze({
    code: "ticket_severity:create",
    name: "Create Ticket Severity",
    description: "Create ticket severity entries.",
    resource: "ticket_severity",
    action: "create",
  }),
  Object.freeze({
    code: "ticket_severity:update",
    name: "Update Ticket Severity",
    description: "Update ticket severity entries.",
    resource: "ticket_severity",
    action: "update",
  }),
  Object.freeze({
    code: "ticket_severity:delete",
    name: "Delete Ticket Severity",
    description: "Delete ticket severity entries where permitted.",
    resource: "ticket_severity",
    action: "delete",
  }),

  // Ticket Issue Category
  Object.freeze({
    code: "ticket_issue_category:read",
    name: "Read Ticket Issue Category",
    description: "View ticket issue category configuration and information.",
    resource: "ticket_issue_category",
    action: "read",
  }),
  Object.freeze({
    code: "ticket_issue_category:create",
    name: "Create Ticket Issue Category",
    description: "Create ticket issue categories.",
    resource: "ticket_issue_category",
    action: "create",
  }),
  Object.freeze({
    code: "ticket_issue_category:update",
    name: "Update Ticket Issue Category",
    description: "Update ticket issue categories.",
    resource: "ticket_issue_category",
    action: "update",
  }),
  Object.freeze({
    code: "ticket_issue_category:delete",
    name: "Delete Ticket Issue Category",
    description: "Delete ticket issue categories where permitted.",
    resource: "ticket_issue_category",
    action: "delete",
  }),

  // Ticket Dependency Category
  Object.freeze({
    code: "ticket_dependency_category:read",
    name: "Read Ticket Dependency Category",
    description:
      "View ticket dependency category configuration and information.",
    resource: "ticket_dependency_category",
    action: "read",
  }),
  Object.freeze({
    code: "ticket_dependency_category:create",
    name: "Create Ticket Dependency Category",
    description: "Create ticket dependency categories.",
    resource: "ticket_dependency_category",
    action: "create",
  }),
  Object.freeze({
    code: "ticket_dependency_category:update",
    name: "Update Ticket Dependency Category",
    description: "Update ticket dependency categories.",
    resource: "ticket_dependency_category",
    action: "update",
  }),
  Object.freeze({
    code: "ticket_dependency_category:delete",
    name: "Delete Ticket Dependency Category",
    description: "Delete ticket dependency categories where permitted.",
    resource: "ticket_dependency_category",
    action: "delete",
  }),
]);

/**
 * ============================================================================
 * Permission Groups
 * ============================================================================
 *
 * Super Admin receives normal application permissions.
 *
 * Developer receives every system permission.
 *
 * IMPORTANT:
 *
 * Developer authority itself is not represented by ordinary business
 * permissions. Developer-specific authority is enforced by the server RBAC
 * policy.
 */

const SUPERADMIN_PERMISSION_CODES = Object.freeze(
  SYSTEM_PERMISSIONS.map(({ code }) => code),
);

const DEVELOPER_PERMISSION_CODES = Object.freeze(
  SYSTEM_PERMISSIONS.map(({ code }) => code),
);

/**
 * ============================================================================
 * Seed Configuration
 * ============================================================================
 *
 * All environment access is centralized through app.config.js.
 *
 * The seeder must never read process.env directly.
 */

function getSeedConfiguration() {
  const username = appConfig.seeding?.developerUsername?.trim();

  const email = appConfig.seeding?.developerEmail?.trim();

  const password = appConfig.seeding?.developerPassword;

  const defaultOrganizationCode =
    appConfig.seeding?.defaultOrganizationCode?.trim();

  const defaultOrganizationName =
    appConfig.seeding?.defaultOrganizationName?.trim();

  const defaultOrganizationStatus =
    appConfig.seeding?.defaultOrganizationStatus?.trim();

  if (!username) {
    throw new Error("SEED_DEVELOPER_USERNAME is required.");
  }

  if (!email) {
    throw new Error("SEED_DEVELOPER_EMAIL is required.");
  }

  if (!password) {
    throw new Error("SEED_DEVELOPER_PASSWORD is required.");
  }

  if (password.length < 12) {
    throw new Error(
      "SEED_DEVELOPER_PASSWORD must contain at least 12 characters.",
    );
  }

  if (!defaultOrganizationCode) {
    throw new Error("DEFAULT_ORGANIZATION_CODE is required.");
  }

  if (!defaultOrganizationName) {
    throw new Error("DEFAULT_ORGANIZATION_NAME is required.");
  }

  if (!defaultOrganizationStatus) {
    throw new Error("DEFAULT_ORGANIZATION_STATUS is required.");
  }

  if (!["active", "inactive"].includes(defaultOrganizationStatus)) {
    throw new Error(
      "DEFAULT_ORGANIZATION_STATUS must be either 'active' or 'inactive'.",
    );
  }

  return Object.freeze({
    username,
    email,
    password,
    defaultOrganizationCode,
    defaultOrganizationName,
    defaultOrganizationStatus,
  });
}

/**
 * ============================================================================
 * Environment Validation
 * ============================================================================
 */

function validateEnvironment() {
  if (
    appConfig.app.environment !== "development" &&
    appConfig.app.environment !== "production"
  ) {
    throw new Error(
      "RBAC bootstrap seeder can only run in development or production environments.",
    );
  }
}

/**
 * ============================================================================
 * Static Definition Validation
 * ============================================================================
 */

function validateRbacDefinitions() {
  const roleCodes = new Set(SYSTEM_ROLES.map(({ code }) => code));

  if (roleCodes.size !== SYSTEM_ROLES.length) {
    throw new Error("Duplicate system role code detected.");
  }

  if (!roleCodes.has("developer") || !roleCodes.has("superadmin")) {
    throw new Error("Developer and Super Admin system roles are mandatory.");
  }

  if (SYSTEM_ROLES.length !== 2) {
    throw new Error("Bootstrap seeder must contain exactly two system roles.");
  }

  const permissionCodes = new Set(SYSTEM_PERMISSIONS.map(({ code }) => code));

  if (permissionCodes.size !== SYSTEM_PERMISSIONS.length) {
    throw new Error("Duplicate system permission code detected.");
  }

  for (const permission of SYSTEM_PERMISSIONS) {
    if (permission.code !== `${permission.resource}:${permission.action}`) {
      throw new Error(
        `Permission code/resource/action mismatch: ${permission.code}`,
      );
    }
  }

  for (const permissionCode of SUPERADMIN_PERMISSION_CODES) {
    if (!permissionCodes.has(permissionCode)) {
      throw new Error(`Unknown Super Admin permission: ${permissionCode}`);
    }
  }

  for (const permissionCode of DEVELOPER_PERMISSION_CODES) {
    if (!permissionCodes.has(permissionCode)) {
      throw new Error(`Unknown Developer permission: ${permissionCode}`);
    }
  }
}

/**
 * ============================================================================
 * Role Upsert
 * ============================================================================
 */

async function ensureSystemRole(executor, role) {
  const existingResult = await executor.query(
    `
            SELECT
                id,
                code,
                name,
                description,
                is_system,
                is_immutable,
                is_active
            FROM roles
            WHERE code = $1
            LIMIT 1
        `,
    [role.code],
  );

  if (existingResult.rowCount === 0) {
    const insertResult = await executor.query(
      `
                INSERT INTO roles (
                    id,
                    code,
                    name,
                    description,
                    is_system,
                    is_immutable,
                    is_active
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    TRUE,
                    TRUE,
                    TRUE
                )
                RETURNING
                    id,
                    code,
                    name,
                    description,
                    is_system,
                    is_immutable,
                    is_active
            `,
      [randomUUID(), role.code, role.name, role.description],
    );

    return insertResult.rows[0];
  }

  const existingRole = existingResult.rows[0];

  if (
    existingRole.is_system !== true ||
    existingRole.is_immutable !== true ||
    existingRole.is_active !== true
  ) {
    throw new Error(
      `Protected role '${role.code}' exists in an invalid state.`,
    );
  }

  if (existingRole.name !== role.name) {
    throw new Error(
      `Protected role '${role.code}' has an invalid name '${existingRole.name}'.`,
    );
  }

  return existingRole;
}

/**
 * ============================================================================
 * Permission Upsert
 * ============================================================================
 */

async function ensureSystemPermission(executor, permission) {
  const result = await executor.query(
    `
            INSERT INTO permissions (
                id,
                code,
                name,
                description,
                resource,
                action,
                is_system,
                is_active
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                TRUE,
                TRUE
            )
            ON CONFLICT (code)
            DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                resource = EXCLUDED.resource,
                action = EXCLUDED.action,
                is_system = TRUE,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            RETURNING
                id,
                code,
                name,
                description,
                resource,
                action,
                is_system,
                is_active
        `,
    [
      randomUUID(),
      permission.code,
      permission.name,
      permission.description,
      permission.resource,
      permission.action,
    ],
  );

  return result.rows[0];
}

/**
 * ============================================================================
 * Role Permission Assignment
 * ============================================================================
 */

async function ensureRolePermission(executor, roleId, permissionId) {
  await executor.query(
    `
            INSERT INTO role_permissions (
                role_id,
                permission_id
            )
            VALUES ($1, $2)
            ON CONFLICT (
                role_id,
                permission_id
            )
            DO NOTHING
        `,
    [roleId, permissionId],
  );
}

/**
 * ============================================================================
 * Developer User
 * ============================================================================
 */

async function ensureDeveloperUser(executor, seedConfiguration) {
  const existingResult = await executor.query(
    `
            SELECT
                id,
                username,
                email,
                password_hash,
                status,
                failed_login_attempts,
                locked_until,
                email_verified_at,
                password_changed_at,
                deactivated_at
            FROM users
            WHERE
                LOWER(username) = LOWER($1)
                OR LOWER(email) = LOWER($2)
            LIMIT 1
        `,
    [seedConfiguration.username, seedConfiguration.email],
  );

  if (existingResult.rowCount > 0) {
    const existingUser = existingResult.rows[0];

    if (
      existingUser.username.toLowerCase() !==
        seedConfiguration.username.toLowerCase() ||
      existingUser.email.toLowerCase() !== seedConfiguration.email.toLowerCase()
    ) {
      throw new Error(
        "Developer bootstrap username/email conflicts with an existing user.",
      );
    }

    if (existingUser.status !== AUTH_ACCOUNT_STATUS.ACTIVE) {
      throw new Error("Existing Developer bootstrap user is not active.");
    }

    return existingUser;
  }

  const passwordHash = await passwordService.hashPassword(
    seedConfiguration.password,
  );

  const result = await executor.query(
    `
            INSERT INTO users (
                id,
                username,
                email,
                password_hash,
                status,
                failed_login_attempts,
                locked_until,
                email_verified_at,
                password_changed_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                0,
                NULL,
                NOW(),
                NOW()
            )
            RETURNING
                id,
                username,
                email,
                status,
                failed_login_attempts,
                locked_until,
                email_verified_at,
                password_changed_at,
                deactivated_at
        `,
    [
      randomUUID(),
      seedConfiguration.username,
      seedConfiguration.email,
      passwordHash,
      AUTH_ACCOUNT_STATUS.ACTIVE,
    ],
  );

  return result.rows[0];
}

async function ensureDefaultOrganization(executor, seedConfiguration) {
  const result = await executor.query(
    `
      INSERT INTO organizations (
        id,
        code,
        name,
        description,
        status
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4
      )
      ON CONFLICT (LOWER(code))
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status
      RETURNING
        id,
        code,
        name,
        description,
        status;
    `,
    [
      seedConfiguration.defaultOrganizationCode,
      seedConfiguration.defaultOrganizationName,
      seedConfiguration.defaultOrganizationDescription ?? null,
      seedConfiguration.defaultOrganizationStatus,
    ],
  );

  return result.rows[0];
}

/**
 * ============================================================================
 * Developer Role Assignment
 * ============================================================================
 *
 * The Developer bootstrap account must have exactly the Developer role.
 *
 * Existing role assignments for this specific bootstrap user are removed
 * before the Developer role is assigned.
 *
 * This does not affect any other user.
 */

async function synchronizeDeveloperRole(
  executor,
  developerUserId,
  developerRoleId,
) {
  await executor.query(
    `
            DELETE FROM user_roles
            WHERE user_id = $1
              AND role_id <> $2
        `,
    [developerUserId, developerRoleId],
  );

  await executor.query(
    `
            INSERT INTO user_roles (
                user_id,
                role_id
            )
            VALUES ($1, $2)
            ON CONFLICT (
                user_id,
                role_id
            )
            DO NOTHING
        `,
    [developerUserId, developerRoleId],
  );
}

/**
 * ============================================================================
 * Verify Initial State
 * ============================================================================
 */

async function verifyBootstrapState(
  executor,
  developerUser,
  developerRole,
  superadminRole,
) {
  const developerAssignment = await executor.query(
    `
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                INNER JOIN roles r
                    ON r.id = ur.role_id
                WHERE ur.user_id = $1
                  AND r.code = 'developer'
            `,
    [developerUser.id],
  );

  if (developerAssignment.rows[0].count !== 1) {
    throw new Error("Developer bootstrap role assignment validation failed.");
  }

  const developerRoleAssignments = await executor.query(
    `
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                WHERE ur.role_id = $1
            `,
    [developerRole.id],
  );

  if (developerRoleAssignments.rows[0].count !== 1) {
    throw new Error("Developer role must have exactly one assigned user.");
  }

  const superadminAssignments = await executor.query(
    `
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                WHERE ur.role_id = $1
            `,
    [superadminRole.id],
  );

  if (superadminAssignments.rows[0].count !== 0) {
    throw new Error(
      "Super Admin role must not have an initial user assignment.",
    );
  }

  const roleCountResult = await executor.query(
    `
                SELECT COUNT(*)::INTEGER AS count
                FROM roles
                WHERE code IN (
                    'developer',
                    'superadmin'
                )
            `,
  );

  if (roleCountResult.rows[0].count !== 2) {
    throw new Error("Developer and Super Admin system-role validation failed.");
  }

  logger.info("RBAC bootstrap state validated successfully.", {
    developerUserId: developerUser.id,
    developerRoleId: developerRole.id,
    superadminRoleId: superadminRole.id,
  });
}

/**
 * ============================================================================
 * Main Seeder
 * ============================================================================
 */

async function seedRbac() {
  validateEnvironment();
  validateRbacDefinitions();

  const seedConfiguration = getSeedConfiguration();

  await database.initialize();

  try {
    await executeTransaction(async (transactionContext) => {
      const executor = getQueryExecutor(transactionContext);
      await executor.query("SET LOCAL app.rbac_bootstrap = 'true'");

      /**
       * ------------------------------------------------------------
       * 1. Ensure fixed system roles.
       * ------------------------------------------------------------
       */

      const roles = new Map();

      for (const role of SYSTEM_ROLES) {
        const systemRole = await ensureSystemRole(executor, role);

        roles.set(systemRole.code, systemRole);
      }

      const developerRole = roles.get("developer");

      const superadminRole = roles.get("superadmin");

      if (!developerRole || !superadminRole) {
        throw new Error("Required system roles are unavailable.");
      }

      /**
       * ------------------------------------------------------------
       * 2. Ensure system permissions.
       * ------------------------------------------------------------
       */

      const permissions = new Map();

      for (const permission of SYSTEM_PERMISSIONS) {
        const systemPermission = await ensureSystemPermission(
          executor,
          permission,
        );

        permissions.set(systemPermission.code, systemPermission);
      }

      /**
       * ------------------------------------------------------------
       * 3. Developer permissions.
       * ------------------------------------------------------------
       */

      for (const permissionCode of DEVELOPER_PERMISSION_CODES) {
        const permission = permissions.get(permissionCode);

        if (!permission) {
          throw new Error(
            `Developer permission was not found: ${permissionCode}`,
          );
        }

        await ensureRolePermission(executor, developerRole.id, permission.id);
      }

      /**
       * ------------------------------------------------------------
       * 4. Super Admin permissions.
       * ------------------------------------------------------------
       */

      for (const permissionCode of SUPERADMIN_PERMISSION_CODES) {
        const permission = permissions.get(permissionCode);

        if (!permission) {
          throw new Error(
            `Super Admin permission was not found: ${permissionCode}`,
          );
        }

        await ensureRolePermission(executor, superadminRole.id, permission.id);
      }

      /**
       * ------------------------------------------------------------
       * 5. Ensure Developer bootstrap user.
       * ------------------------------------------------------------
       */

      const developerUser = await ensureDeveloperUser(
        executor,
        seedConfiguration,
      );

      const defaultOrganization = await ensureDefaultOrganization(
        executor,
        seedConfiguration,
      );

      logger.info("Default organization ensured.", {
        organizationId: defaultOrganization.id,
        organizationCode: defaultOrganization.code,
      });

      /**
       * ------------------------------------------------------------
       * 6. Assign Developer role.
       * ------------------------------------------------------------
       */

      await synchronizeDeveloperRole(
        executor,
        developerUser.id,
        developerRole.id,
      );

      /**
       * ------------------------------------------------------------
       * 7. Final verification.
       * ------------------------------------------------------------
       */

      await verifyBootstrapState(
        executor,
        developerUser,
        developerRole,
        superadminRole,
      );

      logger.info("Initial RBAC bootstrap completed.", {
        roleCount: SYSTEM_ROLES.length,
        permissionCount: SYSTEM_PERMISSIONS.length,
        developerUser: developerUser.email,
        superadminUserCount: 0,
      });
    });
  } finally {
    await database.close();
  }
}

/**
 * ============================================================================
 * Process Entry Point
 * ============================================================================
 */

try {
  await seedRbac();

  logger.info("RBAC bootstrap seeder completed successfully.");
} catch (error) {
  logger.error("RBAC bootstrap seeder failed.", {
    message: error.message,
    stack: error.stack,
  });

  process.exitCode = 1;
}
