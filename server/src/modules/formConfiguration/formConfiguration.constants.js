/**
 * ============================================================================
 * CRM for HRMS
 * Form Configuration Constants
 * ============================================================================
 */

export const FIELD_TYPES = Object.freeze([
    "text",
    "textarea",
    "number",
    "email",
    "password",
    "select",
    "multi_select",
    "autocomplete",
    "date",
    "datetime",
    "time",
    "checkbox",
    "switch",
    "radio",
    "file",
]);

export const FIELD_DATA_TYPES = Object.freeze([
    "string",
    "number",
    "boolean",
    "date",
    "datetime",
    "time",
    "file",
    "array",
]);

export const STORAGE_TYPES = Object.freeze([
    "relational",
    "custom_data",
    "reference",
    "specialized",
]);

export const FORM_STATUSES = Object.freeze([
    "active",
    "inactive",
]);

export const FIELD_ERROR_CODES = Object.freeze({
    NOT_FOUND: "FORM_FIELD_NOT_FOUND",
    CODE_EXISTS: "FORM_FIELD_KEY_EXISTS",
    SYSTEM_PROTECTED: "FORM_FIELD_SYSTEM_PROTECTED",
    INVALID_TYPE: "FORM_FIELD_INVALID_TYPE",
    INVALID_DATA_TYPE: "FORM_FIELD_INVALID_DATA_TYPE",
    TYPE_DATA_TYPE_MISMATCH: "FORM_FIELD_TYPE_DATA_TYPE_MISMATCH",
    INVALID_STORAGE_TYPE: "FORM_FIELD_INVALID_STORAGE_TYPE",
    INVALID_STORAGE_MAPPING: "FORM_FIELD_INVALID_STORAGE_MAPPING",
});

export const FORM_ERROR_CODES = Object.freeze({
    NOT_FOUND: "FORM_DEFINITION_NOT_FOUND",
    CODE_EXISTS: "FORM_DEFINITION_CODE_EXISTS",
    ALREADY_DELETED: "FORM_DEFINITION_ALREADY_DELETED",
    NOT_DELETED: "FORM_DEFINITION_NOT_DELETED",
});

export const ASSIGNMENT_ERROR_CODES = Object.freeze({
    FORM_NOT_FOUND: "FORM_DEFINITION_NOT_FOUND",
    FIELD_NOT_FOUND: "FORM_FIELD_NOT_FOUND",
    ALREADY_ASSIGNED: "FORM_FIELD_ALREADY_ASSIGNED",
    NOT_ASSIGNED: "FORM_FIELD_NOT_ASSIGNED",
});

export default Object.freeze({
    FIELD_TYPES,
    FIELD_DATA_TYPES,
    STORAGE_TYPES,
    FORM_STATUSES,
    FIELD_ERROR_CODES,
    FORM_ERROR_CODES,
    ASSIGNMENT_ERROR_CODES,
});
