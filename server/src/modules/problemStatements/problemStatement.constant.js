const PROBLEM_STATEMENT_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Problem statement retrieved successfully.",
    GET_SUCCESS: "Problem statement retrieved successfully.",
    CREATE_SUCCESS: "Problem statement created successfully.",
    UPDATE_SUCCESS: "Problem statement updated successfully.",
    DELETE_SUCCESS: "Problem statement deactivated successfully.",
});

const PROBLEM_STATEMENT_ERROR_CODES = Object.freeze({
    NOT_FOUND: "PROBLEM_STATEMENT_NOT_FOUND",
    CODE_EXISTS: "PROBLEM_STATEMENT_CODE_EXISTS",
    NAME_EXISTS: "PROBLEM_STATEMENT_NAME_EXISTS",
    ALREADY_EXISTS: "PROBLEM_STATEMENT_ALREADY_EXISTS",
});

export {
    PROBLEM_STATEMENT_MESSAGES,
    PROBLEM_STATEMENT_ERROR_CODES,
};