/**
 * ============================================================================
 * CRM for HRMS
 * User Management Constants
 * ============================================================================
 *
 * Purpose:
 * Centralizes user-management-specific constants.
 *
 * This module contains no business logic and no database logic.
 * ============================================================================
 */

/**
 * User account statuses.
 *
 * These values correspond directly to the users.status database constraint.
 */
export const USER_STATUS = Object.freeze({
    PENDING: "pending",
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
    LOCKED: "locked",
});

/**
 * User management error codes.
 */
export const USER_ERROR_CODES = Object.freeze({
    USER_NOT_FOUND: "USER_NOT_FOUND",

    USERNAME_ALREADY_EXISTS:
        "USERNAME_ALREADY_EXISTS",

    EMAIL_ALREADY_EXISTS:
        "EMAIL_ALREADY_EXISTS",

    INVALID_STATUS:
        "INVALID_USER_STATUS",

    SYSTEM_USER_PROTECTED:
        "SYSTEM_USER_PROTECTED",

    SELF_DEACTIVATION_NOT_ALLOWED:
        "SELF_DEACTIVATION_NOT_ALLOWED",
});

/**
 * User management success codes.
 */
export const USER_SUCCESS_CODES = Object.freeze({
    USER_CREATED: "USER_CREATED",
    USER_UPDATED: "USER_UPDATED",
    USER_STATUS_UPDATED: "USER_STATUS_UPDATED",
    USER_DELETED: "USER_DELETED",
});

/**
 * User routes.
 */
export const USER_ROUTES = Object.freeze({
    ROOT: "/",
    BY_ID: "/:userId",
    STATUS: "/:userId/status",
});

/**
 * User constants aggregate.
 */
const userConstants = Object.freeze({
    USER_STATUS,
    USER_ERROR_CODES,
    USER_SUCCESS_CODES,
    USER_ROUTES,
});

export default userConstants;