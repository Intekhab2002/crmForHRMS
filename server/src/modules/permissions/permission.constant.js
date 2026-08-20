/**
 * CRM for HRMS
 * Permission Management Constants
 */

export const PERMISSION_ERROR_CODES = Object.freeze({
    NOT_FOUND: "PERMISSION_NOT_FOUND",
    SYSTEM_PROTECTED: "PERMISSION_SYSTEM_PROTECTED",
    INVALID_ID: "PERMISSION_INVALID_ID",
});

export const PERMISSION_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Permissions retrieved successfully.",
    GET_SUCCESS: "Permission retrieved successfully.",
    CREATE_SUCCESS: "Permission created successfully.",
    UPDATE_SUCCESS: "Permission updated successfully.",
    DELETE_SUCCESS: "Permission deactivated successfully.",
});

export const PERMISSION_STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
});

export default Object.freeze({
    PERMISSION_ERROR_CODES,
    PERMISSION_MESSAGES,
    PERMISSION_STATUS,
});
