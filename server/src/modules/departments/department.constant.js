const DEPARTMENT_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Department retrieved successfully.",
    GET_SUCCESS: "Department retrieved successfully.",
    CREATE_SUCCESS: "Department created successfully.",
    UPDATE_SUCCESS: "Department updated successfully.",
    DELETE_SUCCESS: "Department deactivated successfully.",
});

const DEPARTMENT_ERROR_CODES = Object.freeze({
    NOT_FOUND: "DEPARTMENT_NOT_FOUND",
    CODE_EXISTS: "DEPARTMENT_CODE_EXISTS",
    NAME_EXISTS: "DEPARTMENT_NAME_EXISTS",
    ALREADY_EXISTS: "DEPARTMENT_ALREADY_EXISTS",
});

export {
    DEPARTMENT_MESSAGES,
    DEPARTMENT_ERROR_CODES,
};