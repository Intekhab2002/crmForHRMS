/**
 * ============================================================================
 * CRM for HRMS
 * User Management Routes
 * ============================================================================
 *
 * File:
 *     src/modules/users/user.routes.js
 *
 * Responsibilities:
 *     - Authentication enforcement.
 *     - RBAC permission enforcement.
 *     - HTTP request validation.
 *     - Controller routing.
 *
 * Business logic does not belong in this file.
 * ============================================================================
 */

import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import userController from "./user.controller.js";
import userValidator from "./user.validator.js";

const {
    authenticate,
} = authMiddleware;

const {
    requirePermission,
} = rbacMiddleware;

const {
    USER_READ,
    USER_CREATE,
    USER_UPDATE,
    USER_DELETE,
} = RBAC_PERMISSIONS;

const router =
    Router();

/**
 * ============================================================================
 * Validation Middleware
 * ============================================================================
 */

/**
 * Validate request body.
 *
 * @param {import("zod").ZodSchema} schema
 *
 * @returns {import("express").RequestHandler}
 */
function validateBody(
    schema,
) {
    return (
        req,
        res,
        next,
    ) => {
        try {
            req.body =
                schema.parse(
                    req.body,
                );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

/**
 * Validate route parameters.
 *
 * @param {import("zod").ZodSchema} schema
 *
 * @returns {import("express").RequestHandler}
 */
function validateParams(
    schema,
) {
    return (
        req,
        res,
        next,
    ) => {
        try {
            req.params =
                schema.parse(
                    req.params,
                );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

/**
 * Validate query parameters.
 *
 * @param {import("zod").ZodSchema} schema
 *
 * @returns {import("express").RequestHandler}
 */
// function validateQuery(
//     schema,
// ) {
//     return (
//         req,
//         res,
//         next,
//     ) => {
//         try {
//             req.query =
//                 schema.parse(
//                     req.query,
//                 );

//             return next();
//         } catch (error) {
//             return next(error);
//         }
//     };
// }

function validateQuery(schema) {
    return (
        req,
        res,
        next,
    ) => {
        try {
            req.validatedQuery =
                schema.parse(
                    req.query,
                );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

/**
 * ============================================================================
 * User Routes
 * ============================================================================
 */

/**
 * GET /users
 *
 * Permission:
 *     user:read
 */
router.get(
    "/",
    authenticate,
    requirePermission(
        USER_READ,
    ),
    validateQuery(
        userValidator.userListQuerySchema,
    ),
    userController.getUsers,
);

/**
 * GET /users/:userId
 *
 * Permission:
 *     user:read
 */
router.get(
    "/:userId",
    authenticate,
    requirePermission(
        USER_READ,
    ),
    validateParams(
        userValidator.userIdParamSchema,
    ),
    userController.getUserById,
);

/**
 * POST /users
 *
 * Permission:
 *     user:create
 */
router.post(
    "/",
    authenticate,
    requirePermission(
        USER_CREATE,
    ),
    validateBody(
        userValidator.createUserSchema,
    ),
    userController.createUser,
);

/**
 * PATCH /users/:userId
 *
 * Permission:
 *     user:update
 */
router.patch(
    "/:userId",
    authenticate,
    requirePermission(
        USER_UPDATE,
    ),
    validateParams(
        userValidator.userIdParamSchema,
    ),
    validateBody(
        userValidator.updateUserSchema,
    ),
    userController.updateUser,
);

/**
 * PATCH /users/:userId/status
 *
 * Permission:
 *     user:update
 */
router.patch(
    "/:userId/status",
    authenticate,
    requirePermission(
        USER_UPDATE,
    ),
    validateParams(
        userValidator.userIdParamSchema,
    ),
    validateBody(
        userValidator.updateUserStatusSchema,
    ),
    userController.updateUserStatus,
);

/**
 * DELETE /users/:userId
 *
 * Permission:
 *     user:delete
 */
router.delete(
    "/:userId",
    authenticate,
    requirePermission(
        USER_DELETE,
    ),
    validateParams(
        userValidator.userIdParamSchema,
    ),
    userController.deleteUser,
);

export default router;