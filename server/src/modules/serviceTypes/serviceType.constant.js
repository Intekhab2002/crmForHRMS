const SERVICE_TYPE_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Service types retrieved successfully.",
    GET_SUCCESS: "Service type retrieved successfully.",
    CREATE_SUCCESS: "Service type created successfully.",
    UPDATE_SUCCESS: "Service type updated successfully.",
    DELETE_SUCCESS: "Service type deactivated successfully.",
});

const SERVICE_TYPE_ERROR_CODES = Object.freeze({
    NOT_FOUND: "SERVICE_TYPE_NOT_FOUND",
    CODE_EXISTS: "SERVICE_TYPE_CODE_EXISTS",
    NAME_EXISTS: "SERVICE_TYPE_NAME_EXISTS",
    ALREADY_EXISTS: "SERVICE_TYPE_ALREADY_EXISTS",
});

export {
    SERVICE_TYPE_MESSAGES,
    SERVICE_TYPE_ERROR_CODES,
};