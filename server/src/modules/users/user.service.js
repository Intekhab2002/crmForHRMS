/**
 * ============================================================================
 * CRM for HRMS
 * User Management Service
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import userRepository from "./user.repository.js";
import passwordService from "../auth/auth.password.js";
import { executeTransaction } from "../../database/transaction.js";
import roleRepository from "../roles/role.repository.js";
import { ROLE_SYSTEM_CODES, ROLE_ERROR_CODES } from "../roles/role.constant.js";
import authRepository from "../auth/auth.repository.js";
import { USER_STATUS, USER_ERROR_CODES } from "./user.constants.js";
import rbacAuthority from "../rbac/rbac.authority.js";
import rbacRepository from "../rbac/rbac.repository.js";
import { RBAC_ERROR_CODES } from "../rbac/rbac.constants.js";

/**
 * ============================================================================
 * Helpers
 * ============================================================================
 */

/**
 * Normalize username.
 *
 * @param {string} username
 * @returns {string}
 */
function normalizeUsername(username) {
  return username.trim();
}

/**
 * Normalize email.
 *
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Ensure a user exists.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function requireUser(userId) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw AppError.notFound("User not found.");
  }

  return user;
}

/**
 * Prevent modification of the development/system administrator through
 * destructive user-management operations.
 *
 * The system administrator is identified through its system role rather than
 * by username.
 *
 * This is intentionally kept in the service layer; authorization remains
 * handled by RBAC middleware.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
async function assertUserIsMutable(
  userId,
  actorUserId,
  transactionContext = null,
) {
  await rbacAuthority.requireCanManageUser(
    actorUserId,
    userId,
    transactionContext,
  );
}

/**
 * ============================================================================
 * User Queries
 * ============================================================================
 */

/**
 * Get a user by ID.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getUserById(userId) {
  return requireUser(userId);
}

/**
 * Get paginated users.
 *
 * @param {{
 *     page?: number,
 *     limit?: number,
 * }} options
 *
 * @returns {Promise<{
 *     data: Array<object>,
 *     pagination: object,
 * }>}
 */
async function getUsers({
  page = 1,
  limit = 20,
  search = "",
  status = null,
  roleCode = null,
} = {}) {
  const normalizedPage = Math.max(Number(page) || 1, 1);

  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const normalizedSearch = String(search || "").trim();

  const normalizedStatus = status?.trim() || null;

  const normalizedRoleCode = roleCode?.trim().toLowerCase() || null;
  const offset = (normalizedPage - 1) * normalizedLimit;

  const [users, total] = await Promise.all([
    userRepository.findUsers(normalizedLimit, offset, {
      search: normalizedSearch,
      status: normalizedStatus,
      roleCode: normalizedRoleCode,
    }),

    userRepository.countUsers({
      search: normalizedSearch,
      status: normalizedStatus,
      roleCode: normalizedRoleCode,
    }),
  ]);

  const totalPages = Math.ceil(total / normalizedLimit);

  return {
    data: users,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages,
      hasNextPage: normalizedPage < totalPages,
      hasPreviousPage: normalizedPage > 1,
    },
  };
}

async function getUserRoles(userId, transactionContext = null) {
  return rbacRepository.findUserRoles(userId, transactionContext);
}

/**
 * ============================================================================
 * Create
 * ============================================================================
 */

/**
 * Create a user.
 *
 * @param {{
 *     username: string,
 *     email: string,
 *     password: string,
 *     status: string,
 * }} data
 *
 * @returns {Promise<object>}
 */
async function createUser(
  {
    username,
    email,
    password,
    status = USER_STATUS.ACTIVE,
    roleCode = null,

    firstName = null,
    lastName = null,
    phone = null,
    designation = null,

    organizationId = null,
    departmentId = null,
  },
  actorUserId,
) {
  const normalizedFirstName = firstName?.trim() || null;

  const normalizedLastName = lastName?.trim() || null;

  const normalizedPhone = phone?.trim() || null;

  const normalizedDesignation = designation?.trim() || null;

  const normalizedOrganizationId = organizationId || null;

  const normalizedDepartmentId = departmentId || null;

  const [existingUsername, existingEmail] = await Promise.all([
    userRepository.findUserByUsername(normalizedUsername),
    userRepository.findUserByEmail(normalizedEmail),
  ]);

  if (existingUsername) {
    throw AppError.conflict("Username is already in use.");
  }

  if (existingEmail) {
    throw AppError.conflict("Email address is already in use.");
  }

  const passwordHash = await passwordService.hashPassword(password);

  return executeTransaction(
    async (transactionContext) => {
      await validateOrganizationDepartment(
        normalizedOrganizationId,
        normalizedDepartmentId,
        transactionContext,
      );
      let targetRole = null;

      if (normalizedRoleCode) {
        targetRole = await roleRepository.findRoleByCode(
          normalizedRoleCode,
          transactionContext,
        );

        if (!targetRole) {
          throw AppError.badRequest("The requested role does not exist.", {
            code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
          });
        }

        await rbacAuthority.requireCanAssignRole(
          actorUserId,
          targetRole,
          transactionContext,
        );

        if (!targetRole.is_active) {
          throw AppError.conflict(
            "An inactive role cannot be assigned to a user.",
            {
              code: ROLE_ERROR_CODES.ROLE_INVALID,
            },
          );
        }

        if (targetRole.code === ROLE_SYSTEM_CODES.SUPERADMIN) {
          const developerRole = await roleRepository.findRoleByCode(
            ROLE_SYSTEM_CODES.DEVELOPER,
            transactionContext,
          );

          if (!developerRole) {
            throw AppError.conflict(
              "The protected developer role is missing. Superadmin provisioning has been refused.",
              { code: RBAC_ERROR_CODES.DEVELOPER_PROTECTED },
            );
          }

          const developerAssignments =
            await roleRepository.countRoleUsersForUpdate(
              developerRole.id,
              transactionContext,
            );

          const actorRoles = await getUserRoles(
            actorUserId,
            transactionContext,
          );

          const actorIsDeveloper = actorRoles.some(
            ({ code }) => code === ROLE_SYSTEM_CODES.DEVELOPER,
          );

          if (!actorIsDeveloper || developerAssignments !== 1) {
            throw AppError.forbidden(
              "Superadmin provisioning requires exactly one valid developer account.",
              { code: RBAC_ERROR_CODES.PERMISSION_REQUIRED },
            );
          }

          const existingSuperadmins =
            await roleRepository.countRoleUsersForUpdate(
              targetRole.id,
              transactionContext,
            );

          if (existingSuperadmins > 0) {
            throw AppError.conflict(
              "Only one superadmin account is permitted.",
              {
                code: ROLE_ERROR_CODES.ROLE_SINGLETON_VIOLATION,
              },
            );
          }
        }
      }

      const user = await userRepository.createUser(
        {
          username: normalizedUsername,
          email: normalizedEmail,
          passwordHash,
          status,

          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          phone: normalizedPhone,
          designation: normalizedDesignation,

          organizationId: normalizedOrganizationId,
          departmentId: normalizedDepartmentId,
        },
        transactionContext,
      );

      if (targetRole) {
        await roleRepository.assignRoleToUser(
          user.id,
          targetRole.id,
          transactionContext,
        );
      }

      const createdUser = await userRepository.findUserById(
        user.id,
        transactionContext,
      );

      const createdRoles = await getUserRoles(user.id, transactionContext);

      return {
        ...createdUser,
        roles: createdRoles,
      };
    },
    { isolationLevel: "SERIALIZABLE" },
  );
}

/**
 * ============================================================================
 * Update
 * ============================================================================
 */

/**
 * Update user identity information.
 *
 * @param {string} userId
 * @param {{
 *     username?: string,
 *     email?: string,
 * }} data
 *
 * @returns {Promise<object>}
 */
async function updateUser(
  userId,
  {
    username,
    email,
    roleCode,

    firstName,
    lastName,
    phone,
    designation,

    organizationId,
    departmentId,
  },
  actorUserId,
) {
  await requireUser(userId);

  await assertUserIsMutable(userId, actorUserId);

  const normalizedUsername =
    username !== undefined ? normalizeUsername(username) : undefined;

  const normalizedEmail =
    email !== undefined ? normalizeEmail(email) : undefined;

  const normalizedFirstName =
    firstName !== undefined ? firstName?.trim() || null : undefined;

  const normalizedLastName =
    lastName !== undefined ? lastName?.trim() || null : undefined;

  const normalizedPhone =
    phone !== undefined ? phone?.trim() || null : undefined;

  const normalizedDesignation =
    designation !== undefined ? designation?.trim() || null : undefined;

  const normalizedOrganizationId =
    organizationId !== undefined ? organizationId || null : undefined;

  const normalizedDepartmentId =
    departmentId !== undefined ? departmentId || null : undefined;

  if (normalizedUsername) {
    const existing =
      await userRepository.findUserByUsername(normalizedUsername);
    if (existing && existing.id !== userId) {
      throw AppError.conflict("Username is already in use.", {
        code: USER_ERROR_CODES.USERNAME_ALREADY_EXISTS,
      });
    }
  }

  if (normalizedEmail) {
    const existing = await userRepository.findUserByEmail(normalizedEmail);
    if (existing && existing.id !== userId) {
      throw AppError.conflict("Email address is already in use.", {
        code: USER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      });
    }
  }

  const normalizedRoleCode = roleCode?.trim().toLowerCase() || null;

  return executeTransaction(
    async (transactionContext) => {
      const currentRoles = await getUserRoles(userId, transactionContext);

      const isDeveloper = currentRoles.some(
        ({ code }) => code === ROLE_SYSTEM_CODES.DEVELOPER,
      );

      if (isDeveloper && normalizedRoleCode !== null) {
        throw AppError.forbidden(
          "The developer role is protected and cannot be changed.",
          { code: ROLE_ERROR_CODES.ROLE_DEVELOPER_PROTECTED },
        );
      }

      if (
        normalizedOrganizationId !== undefined ||
        normalizedDepartmentId !== undefined
      ) {
        const currentUser = await userRepository.findUserById(
          userId,
          transactionContext,
        );

        const effectiveOrganizationId =
          normalizedOrganizationId !== undefined
            ? normalizedOrganizationId
            : currentUser.organization_id;

        const effectiveDepartmentId =
          normalizedDepartmentId !== undefined
            ? normalizedDepartmentId
            : currentUser.department_id;

        await validateOrganizationDepartment(
          effectiveOrganizationId,
          effectiveDepartmentId,
          transactionContext,
        );
      }

      const updatedUser = await userRepository.updateUser(
        userId,
        {
          username: normalizedUsername,
          email: normalizedEmail,

          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          phone: normalizedPhone,
          designation: normalizedDesignation,

          organizationId: normalizedOrganizationId,
          departmentId: normalizedDepartmentId,
        },
        transactionContext,
      );

      if (!updatedUser) {
        throw AppError.notFound("User not found.", {
          code: USER_ERROR_CODES.USER_NOT_FOUND,
        });
      }

      let roles = currentRoles;

      if (normalizedRoleCode) {
        const targetRole = await roleRepository.findRoleByCode(
          normalizedRoleCode,
          transactionContext,
        );

        if (!targetRole) {
          throw AppError.badRequest("The requested role does not exist.", {
            code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
          });
        }

        if (targetRole.code === ROLE_SYSTEM_CODES.SUPERADMIN) {
          const actorRoles = await getUserRoles(
            actorUserId,
            transactionContext,
          );

          const actorIsDeveloper = actorRoles.some(
            ({ code }) => code === ROLE_SYSTEM_CODES.DEVELOPER,
          );

          if (!actorIsDeveloper) {
            throw AppError.forbidden(
              "Only the Developer can assign the Super Admin role.",
              {
                code: ROLE_ERROR_CODES.ROLE_ASSIGNMENT_FORBIDDEN,
              },
            );
          }

          const existingSuperadmins =
            await roleRepository.countRoleUsersForUpdate(
              targetRole.id,
              transactionContext,
            );

          /*
           * The current target may already be the singleton Super Admin.
           */
          const targetAlreadyHasSuperadmin = currentRoles.some(
            ({ code }) => code === ROLE_SYSTEM_CODES.SUPERADMIN,
          );

          if (existingSuperadmins > 0 && !targetAlreadyHasSuperadmin) {
            throw AppError.conflict(
              "Only one Super Admin account is permitted.",
              {
                code: ROLE_ERROR_CODES.ROLE_SINGLETON_VIOLATION,
              },
            );
          }
        }

        await rbacAuthority.requireCanAssignRole(
          actorUserId,
          targetRole,
          transactionContext,
        );

        if (!targetRole.is_active) {
          throw AppError.conflict(
            "An inactive role cannot be assigned to a user.",
            { code: ROLE_ERROR_CODES.ROLE_INVALID },
          );
        }

        await roleRepository.replaceUserRole(
          userId,
          targetRole.id,
          transactionContext,
        );

        roles = await getUserRoles(userId, transactionContext);
      }

      const refreshedUser = await userRepository.findUserById(
        userId,
        transactionContext,
      );

      return {
        ...refreshedUser,
        roles,
      };
    },
    { isolationLevel: "SERIALIZABLE" },
  );
}

/**
 * ============================================================================
 * Status
 * ============================================================================
 */

/**
 * Update account status.
 *
 * @param {string} userId
 * @param {string} status
 *
 * @returns {Promise<object>}
 */
async function updateUserStatus(userId, status, actorUserId) {
  return executeTransaction(
    async (transactionContext) => {
      const user = await requireUser(userId);

      if (user.status === status) {
        return user;
      }

      await assertTargetUserMutable(
        actorUserId,
        userId,
        "status",
        transactionContext,
      );

      const updatedUser = await userRepository.updateUserStatus(
        userId,
        status,
        transactionContext,
      );

      if (!updatedUser) {
        throw AppError.notFound("User not found.", {
          code: USER_ERROR_CODES.USER_NOT_FOUND,
        });
      }

      if (
        status === USER_STATUS.INACTIVE ||
        status === USER_STATUS.SUSPENDED ||
        status === USER_STATUS.LOCKED
      ) {
        await authRepository.revokeActiveSessions(userId, transactionContext);
      }

      return updatedUser;
    },
    {
      isolationLevel: "SERIALIZABLE",
    },
  );
}

/**
 * ============================================================================
 * Delete
 * ============================================================================
 */

/**
 * Delete a user.
 *
 * This is intentionally a hard delete at this stage because the users schema
 * already has lifecycle fields and no separate soft-delete contract has been
 * finalized.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function deleteUser(userId, actorUserId) {
  return executeTransaction(
    async (transactionContext) => {
      await assertTargetUserMutable(
        actorUserId,
        userId,
        "delete",
        transactionContext,
      );

      const user = await userRepository.findUserById(
        userId,
        transactionContext,
      );

      if (!user) {
        throw AppError.notFound("User not found.", {
          code: USER_ERROR_CODES.USER_NOT_FOUND,
        });
      }

      const deletedUser = await userRepository.deleteUser(
        userId,
        transactionContext,
      );

      if (!deletedUser) {
        throw AppError.notFound("User not found.", {
          code: USER_ERROR_CODES.USER_NOT_FOUND,
        });
      }

      await authRepository.revokeActiveSessions(userId, transactionContext);

      return deletedUser;
    },
    {
      isolationLevel: "SERIALIZABLE",
    },
  );
}

async function validateOrganizationDepartment(
  organizationId,
  departmentId,
  transactionContext,
) {
  let organization = null;
  let department = null;

  if (organizationId) {
    organization = await userRepository.findOrganizationById(
      organizationId,
      transactionContext,
    );

    if (!organization) {
      throw AppError.badRequest("The requested organization does not exist.", {
        code: USER_ERROR_CODES.ORGANIZATION_NOT_FOUND,
      });
    }

    if (organization.status !== "active") {
      throw AppError.conflict(
        "An inactive organization cannot be assigned to a user.",
        {
          code: USER_ERROR_CODES.ORGANIZATION_NOT_FOUND,
        },
      );
    }
  }

  if (departmentId) {
    department = await userRepository.findDepartmentById(
      departmentId,
      transactionContext,
    );

    if (!department) {
      throw AppError.badRequest("The requested department does not exist.", {
        code: USER_ERROR_CODES.DEPARTMENT_NOT_FOUND,
      });
    }

    if (department.status !== "active") {
      throw AppError.conflict(
        "An inactive department cannot be assigned to a user.",
        {
          code: USER_ERROR_CODES.DEPARTMENT_NOT_FOUND,
        },
      );
    }

    if (organizationId && department.organization_id !== organizationId) {
      throw AppError.badRequest(
        "The selected department does not belong to the selected organization.",
        {
          code: USER_ERROR_CODES.DEPARTMENT_ORGANIZATION_MISMATCH,
        },
      );
    }
  }

  return {
    organization,
    department,
  };
}

async function assertTargetUserMutable(
  actorUserId,
  targetUserId,
  operation,
  transactionContext = null,
) {
  if (!actorUserId) {
    throw AppError.unauthorized("Authenticated user context is required.");
  }

  if (actorUserId === targetUserId) {
    throw AppError.forbidden(
      "You cannot perform this administrative operation on your own account.",
      {
        code: USER_ERROR_CODES.SELF_DEACTIVATION_NOT_ALLOWED,
      },
    );
  }

  const [targetUser, targetRoles] = await Promise.all([
    userRepository.findUserById(targetUserId, transactionContext),
    getUserRoles(targetUserId, transactionContext),
  ]);

  if (!targetUser) {
    throw AppError.notFound("User not found.", {
      code: USER_ERROR_CODES.USER_NOT_FOUND,
    });
  }

  const permissionByOperation = Object.freeze({
    status: "user:update",
    delete: "user:delete",
    update: "user:update",
  });

  const permissionCode = permissionByOperation[operation];

  if (!permissionCode) {
    throw new TypeError(`Unsupported user management operation: ${operation}`);
  }

  await rbacAuthority.requireCanManageUser(
    actorUserId,
    targetUser,
    targetRoles,
    permissionCode,
    transactionContext,
  );
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const userService = Object.freeze({
  getUserById,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
});

export default userService;
