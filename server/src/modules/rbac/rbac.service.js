/**
 * ============================================================================
 * CRM for HRMS
 * RBAC Service
 * ============================================================================
 *
 * File:
 *     src/modules/rbac/rbac.service.js
 *
 * Purpose:
 *     Contains authorization business logic for the CRM for HRMS backend.
 *
 * Responsibilities:
 *     - Resolve a user's authorization context.
 *     - Determine whether a user has a role.
 *     - Determine whether a user has a permission.
 *     - Enforce role requirements.
 *     - Enforce permission requirements.
 *
 * This service does NOT:
 *     - Handle HTTP requests or responses.
 *     - Execute SQL directly.
 *     - Manage PostgreSQL transactions.
 *     - Decode JWTs.
 *     - Authenticate users.
 *
 * Authentication and authorization are intentionally separate concerns.
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import rbacRepository from "./rbac.repository.js";
import rbacConstants from "./rbac.constants.js";

const {
    RBAC_ERROR_CODES,
} = rbacConstants;

/**
 * ============================================================================
 * Validation Helpers
 * ============================================================================
 */

/**
 * Validate a user identifier.
 *
 * @param {string} userId
 * @returns {void}
 * @throws {AppError}
 */
function assertUserId(userId) {
    if (
        typeof userId !== "string" ||
        userId.trim().length === 0
    ) {
        throw AppError.unauthorized(
            "Authentication is required.",
            {
                code: RBAC_ERROR_CODES.ACCESS_DENIED,
            },
        );
    }
}

/**
 * Validate a permission code.
 *
 * @param {string} permissionCode
 * @returns {void}
 * @throws {AppError}
 */
function assertPermissionCode(permissionCode) {
    if (
        typeof permissionCode !== "string" ||
        permissionCode.trim().length === 0
    ) {
        throw AppError.internal(
            "Authorization permission configuration is invalid.",
            {
                code:
                    RBAC_ERROR_CODES.PERMISSION_REQUIRED,
            },
        );
    }
}

/**
 * Validate a role code.
 *
 * @param {string} roleCode
 * @returns {void}
 * @throws {AppError}
 */
function assertRoleCode(roleCode) {
    if (
        typeof roleCode !== "string" ||
        roleCode.trim().length === 0
    ) {
        throw AppError.internal(
            "Authorization role configuration is invalid.",
            {
                code:
                    RBAC_ERROR_CODES.ROLE_REQUIRED,
            },
        );
    }
}

/**
 * ============================================================================
 * Authorization Context
 * ============================================================================
 */

/**
 * Resolve the current authorization context for a user.
 *
 * No authorization cache is introduced at this stage.
 *
 * Therefore changes to role assignment or permission assignment are reflected
 * immediately by subsequent authorization checks.
 *
 * @param {string} userId
 * @returns {Promise<{
 *     roles: Array<object>,
 *     permissions: Array<object>
 * }>}
 */
async function getAuthorizationContext(
    userId,
) {
    assertUserId(userId);

    return rbacRepository.findAuthorizationContext(
        userId,
    );
}

/**
 * ============================================================================
 * Permission Checks
 * ============================================================================
 */

/**
 * Determine whether a user has a specific permission.
 *
 * @param {string} userId
 * @param {string} permissionCode
 *
 * @returns {Promise<boolean>}
 */
async function hasPermission(
    userId,
    permissionCode,
) {
    assertUserId(userId);
    assertPermissionCode(permissionCode);

    return rbacRepository.userHasPermission(
        userId,
        permissionCode,
    );
}

/**
 * Require a specific permission.
 *
 * This is the main authorization business rule consumed by the authorization
 * middleware.
 *
 * @param {string} userId
 * @param {string} permissionCode
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError}
 */
async function requirePermission(
    userId,
    permissionCode,
) {
    const allowed =
        await hasPermission(
            userId,
            permissionCode,
        );

    if (!allowed) {
        throw AppError.forbidden(
            "You do not have permission to perform this action.",
            {
                code:
                    RBAC_ERROR_CODES.ACCESS_DENIED,
            },
        );
    }
}

/**
 * ============================================================================
 * Role Checks
 * ============================================================================
 */

/**
 * Determine whether a user has a specific role.
 *
 * @param {string} userId
 * @param {string} roleCode
 *
 * @returns {Promise<boolean>}
 */
async function hasRole(
    userId,
    roleCode,
) {
    assertUserId(userId);
    assertRoleCode(roleCode);

    return rbacRepository.userHasRole(
        userId,
        roleCode,
    );
}

/**
 * Require a specific role.
 *
 * @param {string} userId
 * @param {string} roleCode
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError}
 */
async function requireRole(
    userId,
    roleCode,
) {
    const allowed =
        await hasRole(
            userId,
            roleCode,
        );

    if (!allowed) {
        throw AppError.forbidden(
            "You do not have the required role to perform this action.",
            {
                code:
                    RBAC_ERROR_CODES.ACCESS_DENIED,
            },
        );
    }
}

/**
 * ============================================================================
 * Public Service API
 * ============================================================================
 */

const rbacService = Object.freeze({
    getAuthorizationContext,

    hasPermission,
    requirePermission,

    hasRole,
    requireRole,
});

export default rbacService;