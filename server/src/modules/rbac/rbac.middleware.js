/**
 * ============================================================================
 * CRM for HRMS
 * RBAC Authorization Middleware
 * ============================================================================
 *
 * File:
 *     src/modules/rbac/rbac.middleware.js
 *
 * Purpose:
 *     Provides Express middleware factories for RBAC authorization.
 *
 * Responsibilities:
 *     - Ensure authentication has already established req.auth.
 *     - Enforce required permissions.
 *     - Enforce required roles.
 *
 * This middleware does NOT:
 *     - Authenticate JWTs.
 *     - Read Authorization headers.
 *     - Generate tokens.
 *     - Perform SQL directly.
 *     - Contain authorization business rules.
 *
 * Expected middleware order:
 *
 *     authenticate
 *          ↓
 *     requirePermission(...)
 *          ↓
 *     controller
 *
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import rbacService from "./rbac.service.js";
import rbacConstants from "./rbac.constants.js";

const {
    RBAC_ERROR_CODES,
} = rbacConstants;

/**
 * ============================================================================
 * Internal Helpers
 * ============================================================================
 */

/**
 * Extract the authenticated user ID from the request.
 *
 * @param {import("express").Request} request
 *
 * @returns {string}
 *
 * @throws {AppError}
 */
function getAuthenticatedUserId(
    request,
) {
    const userId =
        request?.auth?.userId;

    if (
        typeof userId !== "string" ||
        userId.trim().length === 0
    ) {
        throw AppError.unauthorized(
            "Authentication is required.",
            {
                code:
                    RBAC_ERROR_CODES.ACCESS_DENIED,
            },
        );
    }

    return userId;
}

/**
 * Validate middleware configuration.
 *
 * @param {string} permissionCode
 * @returns {void}
 */
function assertPermissionConfiguration(
    permissionCode,
) {
    if (
        typeof permissionCode !== "string" ||
        permissionCode.trim().length === 0
    ) {
        throw new TypeError(
            "Permission code is required when creating authorization middleware.",
        );
    }
}

/**
 * Validate middleware configuration.
 *
 * @param {string} roleCode
 * @returns {void}
 */
function assertRoleConfiguration(
    roleCode,
) {
    if (
        typeof roleCode !== "string" ||
        roleCode.trim().length === 0
    ) {
        throw new TypeError(
            "Role code is required when creating authorization middleware.",
        );
    }
}

/**
 * ============================================================================
 * Permission Middleware
 * ============================================================================
 */

/**
 * Create middleware requiring a specific permission.
 *
 * Example:
 *
 *     router.get(
 *         "/users",
 *         authenticate,
 *         requirePermission(
 *             RBAC_PERMISSIONS.USER_READ,
 *         ),
 *         controller,
 *     );
 *
 * @param {string} permissionCode
 *
 * @returns {import("express").RequestHandler}
 */
function requirePermission(
    permissionCode,
) {
    assertPermissionConfiguration(
        permissionCode,
    );

    return async (
        request,
        response,
        next,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    request,
                );

            await rbacService.requirePermission(
                userId,
                permissionCode,
            );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

/**
 * ============================================================================
 * Role Middleware
 * ============================================================================
 */

/**
 * Create middleware requiring a specific role.
 *
 * Example:
 *
 *     router.get(
 *         "/administration",
 *         authenticate,
 *         requireRole(
 *             RBAC_ROLES.ADMIN,
 *         ),
 *         controller,
 *     );
 *
 * @param {string} roleCode
 *
 * @returns {import("express").RequestHandler}
 */
function requireRole(
    roleCode,
) {
    assertRoleConfiguration(
        roleCode,
    );

    return async (
        request,
        response,
        next,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    request,
                );

            await rbacService.requireRole(
                userId,
                roleCode,
            );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const rbacMiddleware = Object.freeze({
    requirePermission,
    requireRole,
});

export {
    requirePermission,
    requireRole,
};

export default rbacMiddleware;