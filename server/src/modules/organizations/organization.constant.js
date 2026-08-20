export const ORGANIZATION_ERROR_CODES = Object.freeze({
    NOT_FOUND: "ORGANIZATION_NOT_FOUND",
    CODE_EXISTS: "ORGANIZATION_CODE_EXISTS",
    NAME_EXISTS: "ORGANIZATION_NAME_EXISTS",
    INVALID_ID: "ORGANIZATION_INVALID_ID",
    HAS_DEPARTMENTS: "ORGANIZATION_HAS_DEPARTMENTS",
});

export const ORGANIZATION_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Organizations retrieved successfully.",
    GET_SUCCESS: "Organization retrieved successfully.",
    CREATE_SUCCESS: "Organization created successfully.",
    UPDATE_SUCCESS: "Organization updated successfully.",
    DELETE_SUCCESS: "Organization deactivated successfully.",
});

export default Object.freeze({
    ORGANIZATION_ERROR_CODES,
    ORGANIZATION_MESSAGES,
});
