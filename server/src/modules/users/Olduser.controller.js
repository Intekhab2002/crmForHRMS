/**
 * ============================================================================
 * CRM for HRMS
 * User Management Controller
 * ============================================================================
 */

import { ApiResponse } from "../../helpers/ApiResponse.js";

import userService from "./user.service.js";
import {
    USER_SUCCESS_CODES,
} from "./user.constants.js";

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
async function getUsers(
    req,
    res,
    next,
) {
    try {
        const {
            page,
            limit,
        } = req.query;

        const result =
            await userService.getUsers({
                page,
                limit,
            });

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
async function getUserById(
    req,
    res,
    next,
) {
    try {
        const user =
            await userService.getUserById(
                req.params.userId,
            );

        return ApiResponse.success(
            res,
            user,
            "User retrieved successfully.",
        );
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
async function createUser(
    req,
    res,
    next,
) {
    try {
        const user =
            await userService.createUser(
                req.body,
            );

        return ApiResponse.created(
            res,
            user,
            "User created successfully.",
        );
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
async function updateUser(
    req,
    res,
    next,
) {
    try {
        const user =
            await userService.updateUser(
                req.params.userId,
                req.body,
            );

        return ApiResponse.updated(
            res,
            user,
            "User updated successfully.",
        );
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
async function updateUserStatus(
    req,
    res,
    next,
) {
    try {
        const user =
            await userService.updateUserStatus(
                req.params.userId,
                req.body.status,
            );

        return ApiResponse.updated(
            res,
            user,
            "User status updated successfully.",
            {
                code:
                    USER_SUCCESS_CODES.USER_STATUS_UPDATED,
            },
        );
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
async function deleteUser(
    req,
    res,
    next,
) {
    try {
        const user =
            await userService.deleteUser(
                req.params.userId,
            );

        return ApiResponse.deleted(
            res,
            user,
            "User deleted successfully.",
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
});

export default userController;