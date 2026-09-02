const TICKET_CATEGORY_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Ticket categorys retrieved successfully.",
    GET_SUCCESS: "Ticket category retrieved successfully.",
    CREATE_SUCCESS: "Ticket category created successfully.",
    UPDATE_SUCCESS: "Ticket category updated successfully.",
    DELETE_SUCCESS: "Ticket category deactivated successfully.",
});

const TICKET_CATEGORY_ERROR_CODES = Object.freeze({
    NOT_FOUND: "TICKET_CATEGORY_NOT_FOUND",
    CODE_EXISTS: "TICKET_CATEGORY_CODE_EXISTS",
    NAME_EXISTS: "TICKET_CATEGORY_NAME_EXISTS",
    ALREADY_EXISTS: "TICKET_CATEGORY_ALREADY_EXISTS",
});

export {
    TICKET_CATEGORY_MESSAGES,
    TICKET_CATEGORY_ERROR_CODES,
};