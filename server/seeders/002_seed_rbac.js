/**
 * ============================================================================
 * CRM for HRMS
 * RBAC System Seeder
 * ============================================================================
 *
 * File:
 *     seeders/002_seed_rbac.js
 *
 * Purpose:
 *     Seeds the initial system roles, permissions and authorization
 *     relationships required by the CRM for HRMS application.
 *
 * Responsibilities:
 *     - Create system roles.
 *     - Create system permissions.
 *     - Create role-permission relationships.
 *     - Assign the development administrator to the system administrator role.
 *
 * Characteristics:
 *     - Idempotent.
 *     - Transactional.
 *     - Safe to execute repeatedly.
 *     - Does not delete historical/application RBAC data.
 *     - Does not create duplicate relationships.
 *
 * ============================================================================
 */

import { randomUUID } from "node:crypto";

import logger from "../src/config/logger.js";
import database from "../src/database/postgres.js";
import { executeTransaction } from "../src/database/transaction.js";
import { getQueryExecutor } from "../src/database/queryExecutor.js";

/**
 * ============================================================================
 * Development Administrator
 * ============================================================================
 *
 * This must match the administrator created by:
 *
 *     001_create_development_admin.js
 *
 * Do not create the user here.
 * This seeder only assigns the RBAC role.
 */

const DEVELOPMENT_ADMIN_EMAIL = "developer@hrms.com";

/**
 * ============================================================================
 * System Roles
 * ============================================================================
 */

const SYSTEM_ROLES = Object.freeze([
  Object.freeze({
    code: "developer",
    name: "Developer",
    description:
      "Full access to the CRM for HRMS application for development purposes.",
  }),

  Object.freeze({
    code: "superadmin",
    name: "Super Administrator",
    description: "System administrator created only by the developer.",
  }),

  Object.freeze({
    code: "admin",
    name: "Administrator",
    description: "Full administrative access to the CRM for HRMS application.",
  }),

  Object.freeze({
    code: "manager",
    name: "Manager",
    description:
      "Management access to users, tickets, SLA operations and dashboards.",
  }),

  Object.freeze({
    code: "agent",
    name: "Agent",
    description:
      "Operational access to ticket management and support activities.",
  }),

  Object.freeze({
    code: "customer",
    name: "Customer",
    description: "Customer access to create and view support tickets.",
  }),

  
]);

/**
 * ============================================================================
 * System Permissions
 * ============================================================================
 *
 * Every permission contains:
 *
 *     code
 *     name
 *     description
 *     resource
 *     action
 *
 * The resource/action pair is the normalized authorization representation.
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
    description: "Create roles.",
    resource: "role",
    action: "create",
  }),

  Object.freeze({
    code: "role:update",
    name: "Update Roles",
    description: "Update roles.",
    resource: "role",
    action: "update",
  }),

  Object.freeze({
    code: "role:delete",
    name: "Delete Roles",
    description: "Delete roles where permitted by business rules.",
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
    description: "Create permissions.",
    resource: "permission",
    action: "create",
  }),

  Object.freeze({
    code: "permission:update",
    name: "Update Permissions",
    description: "Update permissions.",
    resource: "permission",
    action: "update",
  }),

  Object.freeze({
    code: "permission:delete",
    name: "Delete Permissions",
    description: "Delete permissions where permitted by business rules.",
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
    description: "Deactivate organizations where permitted by business rules.",
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
    description: "Deactivate departments where permitted by business rules.",
    resource: "department",
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
    code: "ticket:delete",
    name: "Delete Tickets",
    description: "Delete tickets where permitted by business rules.",
    resource: "ticket",
    action: "delete",
  }),

  Object.freeze({
    code: "ticket:assign",
    name: "Assign Tickets",
    description: "Assign and reassign tickets.",
    resource: "ticket",
    action: "assign",
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

  // -------------------------------------------------------------------------
  // SLA Management
  // -------------------------------------------------------------------------

  Object.freeze({
    code: "sla:read",
    name: "Read SLA",
    description: "View SLA configuration and SLA information.",
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
    description: "Delete SLA policies where permitted by business rules.",
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

  // -------------------------------------------------------------------------
  // Employee
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
]);

/**
 * ============================================================================
 * Role Permission Matrix
 * ============================================================================
 */

const ROLE_PERMISSION_MATRIX = Object.freeze({
  /**
   * Developer is the highest-privileged development role.
   *
   * It receives every currently defined system permission.
   *
   * New permissions added to SYSTEM_PERMISSIONS automatically
   * become available to the Developer role.
   */
  developer: Object.freeze(SYSTEM_PERMISSIONS.map(({ code }) => code)),

  /**
   * Administrator remains a separate application role.
   *
   * It is intentionally NOT assigned to the development user.
   */
  superadmin: Object.freeze(SYSTEM_PERMISSIONS.map(({ code }) => code)),

  admin: Object.freeze(SYSTEM_PERMISSIONS.map(({ code }) => code)),

  manager: Object.freeze([
    "user:read",
    "user:update",

    "role:read",
    "permission:read",

    "organization:read",
    "organization:create",
    "organization:update",

    "department:read",
    "department:create",
    "department:update",
    "department:delete",

    "ticket:read",
    "ticket:create",
    "ticket:update",
    "ticket:assign",
    "ticket:resolve",
    "ticket:close",

    "sla:read",
    "sla:create",
    "sla:update",

    "dashboard:read",

  ]),

  agent: Object.freeze([
    "ticket:read",
    "ticket:create",
    "ticket:update",
    "ticket:resolve",
    "ticket:close",

    "organization:read",
    "department:read",

    "sla:read",

    "dashboard:read",
    "employee:read",
  ]),

  customer: Object.freeze(["ticket:read", "ticket:create"]),
});

/**
 * ============================================================================
 * Validation
 * ============================================================================
 */

/**
 * Validates the static RBAC definitions before opening a transaction.
 *
 * @returns {void}
 * @throws {Error} When RBAC definitions are inconsistent.
 */
function validateRbacDefinitions() {
  const roleCodes = new Set(SYSTEM_ROLES.map(({ code }) => code));

  if (roleCodes.size !== SYSTEM_ROLES.length) {
    throw new Error("Duplicate system role code detected.");
  }

  const permissionCodes = new Set(SYSTEM_PERMISSIONS.map(({ code }) => code));

  if (permissionCodes.size !== SYSTEM_PERMISSIONS.length) {
    throw new Error("Duplicate system permission code detected.");
  }

  for (const [roleCode, permissionCodesForRole] of Object.entries(
    ROLE_PERMISSION_MATRIX,
  )) {
    if (!roleCodes.has(roleCode)) {
      throw new Error(`Unknown role referenced by RBAC matrix: ${roleCode}`);
    }

    for (const permissionCode of permissionCodesForRole) {
      if (!permissionCodes.has(permissionCode)) {
        throw new Error(
          `Unknown permission referenced by RBAC matrix: ${permissionCode}`,
        );
      }
    }
  }
}

/**
 * ============================================================================
 * Role Upsert
 * ============================================================================
 */

/**
 * Creates or updates a system role.
 *
 * Existing system roles are retained and synchronized with the seed
 * definition. Their IDs are never replaced.
 *
 * @param {object} executor
 * @param {object} role
 * @returns {Promise<object>}
 */
async function upsertRole(executor, role) {
  const result = await executor.query(
    `
            INSERT INTO roles (
                id,
                code,
                name,
                description,
                is_system,
                is_active
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                TRUE,
                TRUE
            )
            ON CONFLICT (code)
            DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                is_system = TRUE,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            RETURNING
                id,
                code,
                name,
                description,
                is_system,
                is_active;
        `,
    [randomUUID(), role.code, role.name, role.description],
  );

  return result.rows[0];
}

/**
 * ============================================================================
 * Permission Upsert
 * ============================================================================
 */

/**
 * Creates or updates a system permission.
 *
 * Existing permission IDs remain unchanged.
 *
 * @param {object} executor
 * @param {object} permission
 * @returns {Promise<object>}
 */
async function upsertPermission(executor, permission) {
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
                is_active;
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

/**
 * Assigns a permission to a role.
 *
 * The composite relationship is intentionally idempotent.
 *
 * @param {object} executor
 * @param {string} roleId
 * @param {string} permissionId
 * @returns {Promise<void>}
 */
async function assignPermissionToRole(executor, roleId, permissionId) {
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
            DO NOTHING;
        `,
    [roleId, permissionId],
  );
}

/**
 * ============================================================================
 * Development Administrator
 * ============================================================================
 */

/**
 * Finds the existing development administrator.
 *
 * @param {object} executor
 * @returns {Promise<object|null>}
 */
async function findDevelopmentAdmin(executor) {
  const result = await executor.query(
    `
            SELECT
                id,
                username,
                email,
                status
            FROM users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1;
        `,
    [DEVELOPMENT_ADMIN_EMAIL],
  );

  return result.rows[0] ?? null;
}

/**
 * ============================================================================
 * Development User Role Synchronization
 * ============================================================================
 */

/**
 * Synchronizes the roles assigned to the development user.
 *
 * The development account is intentionally restricted to exactly one
 * system role: Developer.
 *
 * Existing role assignments for this specific development user are removed
 * before the Developer role is assigned.
 *
 * This does NOT delete roles themselves and does NOT affect other users.
 *
 * The operation runs inside the caller's transaction.
 *
 * @param {object} executor
 * @param {string} userId
 * @param {string} roleId
 * @returns {Promise<void>}
 */
async function synchronizeDevelopmentUserRole(executor, userId, roleId) {
  /**
   * Remove every existing role relationship for this specific
   * development account.
   *
   * This intentionally removes an old admin assignment if one exists.
   */
  await executor.query(
    `
            DELETE FROM user_roles
            WHERE user_id = $1;
        `,
    [userId],
  );

  /**
   * Assign the Developer role as the sole role.
   */
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
            DO NOTHING;
        `,
    [userId, roleId],
  );
}

/**
 * ============================================================================
 * Main Seeder
 * ============================================================================
 */

/**
 * Seeds the complete initial RBAC model inside a single transaction.
 *
 * @returns {Promise<void>}
 */
async function seedRbac() {
  validateRbacDefinitions();

  await database.initialize();

  await executeTransaction(async (transactionContext) => {
    const executor = getQueryExecutor(transactionContext);

    const roles = new Map();

    for (const role of SYSTEM_ROLES) {
      if (["developer", "superadmin"].includes(role.code)) {
        const existingDeveloper = await executor.query(
          `
            SELECT
              id,
              code,
              name,
              description,
              is_system,
              is_active
            FROM roles
            WHERE code = $1
            LIMIT 1;
          `,
          [role.code],
        );

        if (!existingDeveloper.rows[0]) {
          throw new Error(
            `Protected system role '${role.code}' is missing. It must be restored through the controlled database recovery process.`,
          );
        }

        roles.set(role.code, existingDeveloper.rows[0]);
        continue;
      }

      const createdRole = await upsertRole(executor, role);

      roles.set(createdRole.code, createdRole);
    }

    const permissions = new Map();

    for (const permission of SYSTEM_PERMISSIONS) {
      const createdPermission = await upsertPermission(executor, permission);

      permissions.set(createdPermission.code, createdPermission);
    }

    for (const [roleCode, permissionCodes] of Object.entries(
      ROLE_PERMISSION_MATRIX,
    )) {
      const role = roles.get(roleCode);

      if (!role) {
        throw new Error(`Role was not created: ${roleCode}`);
      }

      for (const permissionCode of permissionCodes) {
        const permission = permissions.get(permissionCode);

        if (!permission) {
          throw new Error(`Permission was not created: ${permissionCode}`);
        }

        await assignPermissionToRole(executor, role.id, permission.id);
      }
    }

    const developmentAdmin = await findDevelopmentAdmin(executor);

    if (!developmentAdmin) {
      throw new Error(
        `Development administrator '${DEVELOPMENT_ADMIN_EMAIL}' was not found. Run db:seed:admin first.`,
      );
    }

    const developerRole = roles.get("developer");

    if (!developerRole) {
      throw new Error("System developer role was not created.");
    }

    await synchronizeDevelopmentUserRole(
      executor,
      developmentAdmin.id,
      developerRole.id,
    );
    logger.info("RBAC seed data synchronized successfully.", {
      roleCount: roles.size,
      permissionCount: permissions.size,
      developmentUser: developmentAdmin.email,
      developmentRole: developerRole.code,
    });
  });
}

/**
 * ============================================================================
 * Process Entry Point
 * ============================================================================
 */

try {
  await seedRbac();

  logger.info("RBAC database seeding process completed successfully.");
} catch (error) {
  logger.error("RBAC database seeding process failed.", {
    message: error.message,
    stack: error.stack,
  });

  process.exitCode = 1;
}
