export const DEPARTMENT_ERROR_CODES = Object.freeze({
    NOT_FOUND: "DEPARTMENT_NOT_FOUND",
    CODE_EXISTS: "DEPARTMENT_CODE_EXISTS",
    NAME_EXISTS: "DEPARTMENT_NAME_EXISTS",
    ORGANIZATION_NOT_FOUND: "DEPARTMENT_ORGANIZATION_NOT_FOUND",
    PARENT_NOT_FOUND: "DEPARTMENT_PARENT_NOT_FOUND",
    PARENT_DIFFERENT_ORGANIZATION:
        "DEPARTMENT_PARENT_DIFFERENT_ORGANIZATION",
    HAS_CHILDREN: "DEPARTMENT_HAS_CHILDREN",
});

export const DEPARTMENT_MESSAGES = Object.freeze({
    LIST_SUCCESS: "Departments retrieved successfully.",
    GET_SUCCESS: "Department retrieved successfully.",
    CREATE_SUCCESS: "Department created successfully.",
    UPDATE_SUCCESS: "Department updated successfully.",
    DELETE_SUCCESS: "Department deactivated successfully.",
});

export default Object.freeze({
    DEPARTMENT_ERROR_CODES,
    DEPARTMENT_MESSAGES,
});
