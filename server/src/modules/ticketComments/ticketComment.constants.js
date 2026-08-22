export const TICKET_COMMENT_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Ticket comments retrieved successfully.",
    CREATE_SUCCESS: "Ticket comment added successfully.",
});

export const TICKET_COMMENT_ERROR_CODES = Object.freeze({
    NOT_FOUND: "TICKET_COMMENT_NOT_FOUND",
    TICKET_NOT_FOUND: "TICKET_COMMENT_TICKET_NOT_FOUND",
    USER_NOT_FOUND: "TICKET_COMMENT_USER_NOT_FOUND",
});

export default Object.freeze({
    TICKET_COMMENT_MESSAGES,
    TICKET_COMMENT_ERROR_CODES,
});