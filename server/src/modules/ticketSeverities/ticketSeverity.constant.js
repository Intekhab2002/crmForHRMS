const TICKET_SEVERITY_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Ticket severity retrieved successfully.",
    GET_SUCCESS: "Ticket severity retrieved successfully.",
    CREATE_SUCCESS: "Ticket severity created successfully.",
    UPDATE_SUCCESS: "Ticket severity updated successfully.",
    DELETE_SUCCESS: "Ticket severity deactivated successfully.",
});

const TICKET_SEVERITY_ERROR_CODES = Object.freeze({
    NOT_FOUND: "TICKET_SEVERITY_NOT_FOUND",
    CODE_EXISTS: "TICKET_SEVERITY_CODE_EXISTS",
    NAME_EXISTS: "TICKET_SEVERITY_NAME_EXISTS",
    ALREADY_EXISTS: "TICKET_SEVERITY_ALREADY_EXISTS",
});

export {
    TICKET_SEVERITY_MESSAGES,
    TICKET_SEVERITY_ERROR_CODES,
};