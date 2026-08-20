/**
 * ============================================================================
 * CRM for HRMS
 * User Management Service
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import userRepository from "./user.repository.js";
import passwordService from "../auth/auth.password.js";

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
async function assertUserIsMutable(userId) {
  // System-role protection will be connected to the RBAC repository when
  // system-user administration rules are finalized.
  //
  // At this stage, ordinary users remain fully manageable.
  void userId;
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
}) {
  const normalizedUsername = normalizeUsername(username);

  const normalizedEmail = normalizeEmail(email);

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

  return userRepository.createUser({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    status,
  });
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
async function updateUser(userId, { username, email }) {
  await requireUser(userId);

  await assertUserIsMutable(userId);

  const normalizedUsername =
    username !== undefined ? normalizeUsername(username) : undefined;

  const normalizedEmail =
    email !== undefined ? normalizeEmail(email) : undefined;

  if (normalizedUsername) {
    const existing =
      await userRepository.findUserByUsername(normalizedUsername);

    if (existing && existing.id !== userId) {
      throw AppError.conflict("Username is already in use.");
    }
  }

  if (normalizedEmail) {
    const existing = await userRepository.findUserByEmail(normalizedEmail);

    if (existing && existing.id !== userId) {
      throw AppError.conflict("Email address is already in use.");
    }
  }

  const user = await userRepository.updateUser(userId, {
    username: normalizedUsername,
    email: normalizedEmail,
  });

  if (!user) {
    throw AppError.notFound("User not found.");
  }

  return user;
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
async function updateUserStatus(userId, status) {
  const user = await requireUser(userId);

  if (user.status === status) {
    return user;
  }

  await assertUserIsMutable(userId);

  const updatedUser = await userRepository.updateUserStatus(userId, status);

  if (!updatedUser) {
    throw AppError.notFound("User not found.");
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
async function deleteUser(userId) {
  await requireUser(userId);

  await assertUserIsMutable(userId);

  const deletedUser = await userRepository.deleteUser(userId);

  if (!deletedUser) {
    throw AppError.notFound("User not found.");
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
