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
import roleService from "../roles/role.service.js";
import { ROLE_SYSTEM_CODES, ROLE_ERROR_CODES } from "../roles/role.constant.js";

import { USER_STATUS, USER_ERROR_CODES } from "./user.constants.js";

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
async function assertUserIsMutable(userId, actorUserId, transactionContext = null) {
  await roleService.assertCanManageUser(
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
} = {}) {
    const normalizedPage =
        Math.max(
            Number(page) || 1,
            1,
        );

    const normalizedLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1,
            ),
            100,
        );

    const offset =
        (normalizedPage - 1) *
        normalizedLimit;

    const [
        users,
        total,
    ] = await Promise.all([
        userRepository.findUsers(
            normalizedLimit,
            offset,
        ),
        userRepository.countUsers(),
    ]);

    const totalPages =
        Math.ceil(
            total / normalizedLimit,
        );

    return {
        data: users,
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages,
            hasNextPage:
                normalizedPage < totalPages,
            hasPreviousPage:
                normalizedPage > 1,
        },
    };
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
async function createUser({
  username,
  email,
  password,
  status = USER_STATUS.ACTIVE,
  roleCode = null,
}, actorUserId) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedRoleCode = roleCode?.trim().toLowerCase() || null;

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

  return executeTransaction(async (transactionContext) => {
    let targetRole = null;

    if (normalizedRoleCode) {
      targetRole = await roleRepository.findRoleByCode(
        normalizedRoleCode,
        transactionContext,
      );

      if (!targetRole) {
        throw AppError.badRequest("The requested role does not exist.", {
          code: "ROLE_NOT_FOUND",
        });
      }

      await roleService.assertCanAssignRole(
        actorUserId,
        targetRole,
        transactionContext,
      );

      if (!targetRole.is_active) {
        throw AppError.conflict("An inactive role cannot be assigned to a user.", {
          code: ROLE_ERROR_CODES.ROLE_INVALID,
        });
      }

      if (targetRole.code === ROLE_SYSTEM_CODES.SUPERADMIN) {
        const developerRole = await roleRepository.findRoleByCode(
          ROLE_SYSTEM_CODES.DEVELOPER,
          transactionContext,
        );

        if (!developerRole) {
          throw AppError.conflict(
            "The protected developer role is missing. Superadmin provisioning has been refused.",
            { code: "DEVELOPER_ROLE_MISSING" },
          );
        }

        const developerAssignments = await roleRepository.countRoleUsersForUpdate(
          developerRole.id,
          transactionContext,
        );

        const actorRoles = await roleService.getActorRoles(
          actorUserId,
          transactionContext,
        );

        const actorIsDeveloper = actorRoles.some(
          ({ code }) => code === ROLE_SYSTEM_CODES.DEVELOPER,
        );

        if (!actorIsDeveloper || developerAssignments !== 1) {
          throw AppError.forbidden(
            "Superadmin provisioning requires exactly one valid developer account.",
            { code: "DEVELOPER_INTEGRITY_CHECK_FAILED" },
          );
        }

        const existingSuperadmins = await roleRepository.countRoleUsersForUpdate(
          targetRole.id,
          transactionContext,
        );

        if (existingSuperadmins > 0) {
          throw AppError.conflict("Only one superadmin account is permitted.", {
            code: ROLE_ERROR_CODES.ROLE_SINGLETON_VIOLATION,
          });
        }
      }
    }

    const user = await userRepository.createUser(
      {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        status,
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

    return {
      ...createdUser,
      role: targetRole
        ? {
            id: targetRole.id,
            code: targetRole.code,
            name: targetRole.name,
          }
        : null,
    };
  }, { isolationLevel: "SERIALIZABLE" });
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
async function updateUser(userId, { username, email, roleCode }, actorUserId) {
  await requireUser(userId);

  await assertUserIsMutable(userId, actorUserId);

  const normalizedUsername =
    username !== undefined ? normalizeUsername(username) : undefined;

  const normalizedEmail =
    email !== undefined ? normalizeEmail(email) : undefined;

  if (normalizedUsername) {
    const existing = await userRepository.findUserByUsername(normalizedUsername);
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

  return executeTransaction(async (transactionContext) => {
    const currentRoles = await roleService.getActorRoles(
      userId,
      transactionContext,
    );

    const isDeveloper = currentRoles.some(
      ({ code }) => code === ROLE_SYSTEM_CODES.DEVELOPER,
    );

    if (isDeveloper && normalizedRoleCode) {
      throw AppError.forbidden(
        "The developer role is protected and cannot be changed.",
        { code: ROLE_ERROR_CODES.ROLE_DEVELOPER_PROTECTED },
      );
    }

    const updatedUser = await userRepository.updateUser(
      userId,
      {
        username: normalizedUsername,
        email: normalizedEmail,
      },
      transactionContext,
    );

    if (!updatedUser) {
      throw AppError.notFound("User not found.", {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    let role = currentRoles[0] ?? null;

    if (normalizedRoleCode) {
      const targetRole = await roleRepository.findRoleByCode(
        normalizedRoleCode,
        transactionContext,
      );

      if (!targetRole) {
        throw AppError.badRequest("The requested role does not exist.", {
          code: "ROLE_NOT_FOUND",
        });
      }

      await roleService.assertCanAssignRole(
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

      role = targetRole;
    }

    const refreshedUser = await userRepository.findUserById(
      userId,
      transactionContext,
    );

    return {
      ...refreshedUser,
      role,
    };
  }, { isolationLevel: "SERIALIZABLE" });
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
  const user = await requireUser(userId);

  if (user.status === status) {
    return user;
  }

  await assertUserIsMutable(userId, actorUserId);

  const updatedUser = await userRepository.updateUserStatus(userId, status);

  if (!updatedUser) {
    throw AppError.notFound("User not found.", {
      code: USER_ERROR_CODES.USER_NOT_FOUND,
    });
  }

  return updatedUser;
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
  await requireUser(userId);

  await assertUserIsMutable(userId, actorUserId);

  const deletedUser = await userRepository.deleteUser(userId);

  if (!deletedUser) {
    throw AppError.notFound("User not found.", {
      code: USER_ERROR_CODES.USER_NOT_FOUND,
    });
  }

  return deletedUser;
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
