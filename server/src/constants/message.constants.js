export const SUCCESS_MESSAGES = Object.freeze({
  SUCCESS: "Request completed successfully.",

  CREATED: "Resource created successfully.",

  UPDATED: "Resource updated successfully.",

  DELETED: "Resource deleted successfully.",

  FETCHED: "Data fetched successfully.",

  LOGIN_SUCCESS: "Login successful.",

  HEALTH_CHECK: "Health check completed successfully.",

  READINESS_CHECK: "Readiness check completed successfully.",
});

export const ERROR_MESSAGES = Object.freeze({
  BAD_REQUEST: "Bad request.",

  INTERNAL_SERVER_ERROR: "Internal server error.",

  UNAUTHORIZED: "Unauthorized access.",

  FORBIDDEN: "Permission denied.",

  NOT_FOUND: "Resource not found.",

  VALIDATION_FAILED: "Validation failed.",

  INVALID_CREDENTIALS: "Invalid username or password.",
  CONFLICT: "Resource already exists.",
  SERVICE_NOT_READY: "Application is not ready.",
});
