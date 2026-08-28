/**
 * ============================================================================
 * CRM for HRMS
 * User Management Controller
 * ============================================================================
 */

import { ApiResponse } from "../../helpers/ApiResponse.js";

import userService from "./user.service.js";
import { USER_SUCCESS_CODES } from "./user.constants.js";
import sessionService from "../auth/auth.session.js";

/**
 * Get users.
 *
 * Request query has already been validated and transformed by the route
 * validation middleware.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getUsers(req, res, next) {
  try {
    const { page, limit, search, status, roleCode } = req.validatedQuery;

    const result = await userService.getUsers(
      {
        page,
        limit,
        search,
        status,
        roleCode,
      }
    );
    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      "Users retrieved successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * Get user by ID.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(
      req.validatedParams.userId,
    );

    return ApiResponse.success(res, user, "User retrieved successfully.");
  } catch (error) {
    return next(error);
  }
}

/**
 * Create user.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(
      req.validatedBody,
      req.auth?.userId,
    );

    return ApiResponse.created(res, user, "User created successfully.");
  } catch (error) {
    return next(error);
  }
}

/**
 * Update user.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(
      req.validatedParams.userId,
      req.validatedBody,
      req.auth?.userId,
    );

    return ApiResponse.updated(res, user, "User updated successfully.");
  } catch (error) {
    return next(error);
  }
}

/**
 * Update user status.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function updateUserStatus(req, res, next) {
  try {
    const user = await userService.updateUserStatus(
      req.validatedParams.userId,
      req.validatedBody.status,
      req.auth?.userId,
    );

    return ApiResponse.updated(res, user, "User status updated successfully.", {
      code: USER_SUCCESS_CODES.USER_STATUS_UPDATED,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Delete user.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function deleteUser(req, res, next) {
  try {
    const user = await userService.deleteUser(
      req.validatedParams.userId,
      req.auth?.userId,
    );

    return ApiResponse.deleted(res, user, "User deleted successfully.");
  } catch (error) {
    return next(error);
  }
}

async function revokeUserSessions(req, res, next) {
  try {
    await sessionService.revokeUserSessions(
      req.validatedParams.userId,
      req.auth?.userId,
    );

    return ApiResponse.success(
      res,
      null,
      "User sessions revoked successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * Public controller API.
 */
const userController = Object.freeze({
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  revokeUserSessions,
});

export default userController;
