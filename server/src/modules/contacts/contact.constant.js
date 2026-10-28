

export const CONTACT_ERROR_CODES = Object.freeze({
  NOT_FOUND: "CONTACT_NOT_FOUND",
  ALREADY_EXISTS: "CONTACT_ALREADY_EXISTS",
  INVALID_MOBILE: "CONTACT_INVALID_MOBILE",
  INVALID_DISTRICT: "CONTACT_INVALID_DISTRICT",
  INVALID_ORGANIZATION: "CONTACT_INVALID_ORGANIZATION",
  INVALID_DEPARTMENT: "CONTACT_INVALID_DEPARTMENT",
});

export const CONTACT_MESSAGES = Object.freeze({
  GET_SUCCESS: "Contact retrieved successfully.",
  LIST_SUCCESS: "Contacts retrieved successfully.",
  CREATE_SUCCESS: "Contact created successfully.",
  UPDATE_SUCCESS: "Contact updated successfully.",
  DELETE_SUCCESS: "Contact deactivated successfully.",
});

export default Object.freeze({
    CONTACT_ERROR_CODES,
    CONTACT_MESSAGES,
});