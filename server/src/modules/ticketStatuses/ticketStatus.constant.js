const TICKET_STATUS_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Ticket status retrieved successfully.",
    GET_SUCCESS: "Ticket status retrieved successfully.",
    CREATE_SUCCESS: "Ticket status created successfully.",
    UPDATE_SUCCESS: "Ticket status updated successfully.",
    DELETE_SUCCESS: "Ticket status deactivated successfully.",
});

const TICKET_STATUS_ERROR_CODES = Object.freeze({
    NOT_FOUND: "TICKET_STATUS_NOT_FOUND",
    CODE_EXISTS: "TICKET_STATUS_CODE_EXISTS",
    NAME_EXISTS: "TICKET_STATUS_NAME_EXISTS",
    ALREADY_EXISTS: "TICKET_STATUS_ALREADY_EXISTS",
});

export {
    TICKET_STATUS_MESSAGES,
    TICKET_STATUS_ERROR_CODES,
};