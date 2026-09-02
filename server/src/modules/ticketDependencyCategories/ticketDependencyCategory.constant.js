const TICKET_DEPENDENCY_CATEGORY_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Ticket Dependency Category retrieved successfully.",
    GET_SUCCESS: "Ticket Dependency Category retrieved successfully.",
    CREATE_SUCCESS: "Ticket Dependency Category created successfully.",
    UPDATE_SUCCESS: "Ticket Dependency Category updated successfully.",
    DELETE_SUCCESS: "Ticket Dependency Category deactivated successfully.",
});

const TICKET_DEPENDENCY_CATEGORY_ERROR_CODES = Object.freeze({
    NOT_FOUND: "TICKET_DEPENDENCY_CATEGORY_NOT_FOUND",
    CODE_EXISTS: "TICKET_DEPENDENCY_CATEGORY_CODE_EXISTS",
    NAME_EXISTS: "TICKET_DEPENDENCY_CATEGORY_NAME_EXISTS",
    ALREADY_EXISTS: "TICKET_DEPENDENCY_CATEGORY_ALREADY_EXISTS",
});

export {
    TICKET_DEPENDENCY_CATEGORY_MESSAGES,
    TICKET_DEPENDENCY_CATEGORY_ERROR_CODES,
};