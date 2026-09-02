const CURRENT_BILL_STATUS_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Current bill status retrieved successfully.",
    GET_SUCCESS: "Current bill status retrieved successfully.",
    CREATE_SUCCESS: "Current bill status created successfully.",
    UPDATE_SUCCESS: "Current bill status updated successfully.",
    DELETE_SUCCESS: "Current bill status deactivated successfully.",
});

const CURRENT_BILL_STATUS_ERROR_CODES = Object.freeze({
    NOT_FOUND: "CURRENT_BILL_STATUS_NOT_FOUND",
    CODE_EXISTS: "CURRENT_BILL_STATUS_CODE_EXISTS",
    NAME_EXISTS: "CURRENT_BILL_STATUS_NAME_EXISTS",
    ALREADY_EXISTS: "CURRENT_BILL_STATUS_ALREADY_EXISTS",
});

export {
    CURRENT_BILL_STATUS_MESSAGES,
    CURRENT_BILL_STATUS_ERROR_CODES,
};