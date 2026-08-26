/**
 * CRM for HRMS - Role Management Constants
 */

export const ROLE_ERROR_CODES = Object.freeze({
    ROLE_NOT_FOUND: "ROLE_NOT_FOUND",

    ROLE_SYSTEM_PROTECTED:
        "ROLE_SYSTEM_PROTECTED",

    ROLE_DEVELOPER_PROTECTED:
        "ROLE_DEVELOPER_PROTECTED",

    ROLE_SUPERADMIN_PROTECTED:
        "ROLE_SUPERADMIN_PROTECTED",

    ROLE_HIERARCHY_VIOLATION:
        "ROLE_HIERARCHY_VIOLATION",

    ROLE_SINGLETON_VIOLATION:
        "ROLE_SINGLETON_VIOLATION",

    ROLE_ALREADY_EXISTS:
        "ROLE_ALREADY_EXISTS",

    ROLE_HAS_USERS:
        "ROLE_HAS_USERS",

    ROLE_INVALID:
        "ROLE_INVALID",

    ROLE_ASSIGNMENT_FORBIDDEN:
        "ROLE_ASSIGNMENT_FORBIDDEN",

    ROLE_PERMISSION_INVALID:
        "ROLE_PERMISSION_INVALID",

    ROLE_SELF_MANAGEMENT_FORBIDDEN:
        "ROLE_SELF_MANAGEMENT_FORBIDDEN",

    ROLE_DELETE_FORBIDDEN:
        "ROLE_DELETE_FORBIDDEN",
});


export const ROLE_SUCCESS_CODES = Object.freeze({
    ROLE_CREATED:
        "ROLE_CREATED",

    ROLE_UPDATED:
        "ROLE_UPDATED",

    ROLE_DELETED:
        "ROLE_DELETED",

    ROLE_DEACTIVATED:
        "ROLE_DEACTIVATED",

    ROLE_PERMISSIONS_UPDATED:
        "ROLE_PERMISSIONS_UPDATED",

    ROLE_ASSIGNED:
        "ROLE_ASSIGNED",

    ROLE_UNASSIGNED:
        "ROLE_UNASSIGNED",
});


export const ROLE_STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
});


/**
 * ONLY these two are fixed semantic identities.
 *
 * Do NOT add admin/manager/agent/customer here.
 */
export const ROLE_SYSTEM_CODES = Object.freeze({
    DEVELOPER: "developer",
    SUPERADMIN: "superadmin",
});


export default Object.freeze({
    ROLE_ERROR_CODES,
    ROLE_SUCCESS_CODES,
    ROLE_STATUS,
    ROLE_SYSTEM_CODES,
});