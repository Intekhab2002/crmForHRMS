const TICKET_ISSUE_CATEGORY_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Ticket issue category retrieved successfully.",
    GET_SUCCESS: "Ticket issue category retrieved successfully.",
    CREATE_SUCCESS: "Ticket issue category created successfully.",
    UPDATE_SUCCESS: "Ticket issue category updated successfully.",
    DELETE_SUCCESS: "Ticket issue category deactivated successfully.",
});

const TICKET_ISSUE_CATEGORY_ERROR_CODES = Object.freeze({
    NOT_FOUND: "TICKET_ISSUE_CATEGORY_NOT_FOUND",
    CODE_EXISTS: "TICKET_ISSUE_CATEGORY_CODE_EXISTS",
    NAME_EXISTS: "TICKET_ISSUE_CATEGORY_NAME_EXISTS",
    ALREADY_EXISTS: "TICKET_ISSUE_CATEGORY_ALREADY_EXISTS",
});

export {
    TICKET_ISSUE_CATEGORY_MESSAGES,
    TICKET_ISSUE_CATEGORY_ERROR_CODES,
};