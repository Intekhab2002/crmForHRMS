const DISTRICT_MESSAGES = Object.freeze({
    LIST_SUCCESS: "District retrieved successfully.",
    GET_SUCCESS: "District retrieved successfully.",
    CREATE_SUCCESS: "District created successfully.",
    UPDATE_SUCCESS: "District updated successfully.",
    DELETE_SUCCESS: "District deactivated successfully.",
});

const DISTRICT_ERROR_CODES = Object.freeze({
    NOT_FOUND: "DISTRICT_NOT_FOUND",
    CODE_EXISTS: "DISTRICT_CODE_EXISTS",
    NAME_EXISTS: "DISTRICT_NAME_EXISTS",
    ALREADY_EXISTS: "DISTRICT_ALREADY_EXISTS",
});

export {
    DISTRICT_MESSAGES,
    DISTRICT_ERROR_CODES,
};