/**
 * ============================================================================
 * Application Error
 * ============================================================================
 *
 * Standardized application error class used throughout the CRM for HRMS backend.
 *
 * Responsibilities
 * ----------------
 * • Represents operational (expected) application errors.
 * • Carries HTTP status codes.
 * • Carries machine-readable error codes.
 * • Carries validation details.
 * • Preserves original error cause.
 *
 * This class is intentionally framework-agnostic and should be used by:
 *
 * • Services
 * • Repositories
 * • Authentication
 * • Authorization (RBAC)
 * • Validation
 * • Controllers
 *
 * ============================================================================
 */

import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
  /**
   * Creates a new application error.
   *
   * @param {object} options
   * @param {string} options.message
   * @param {number} [options.statusCode]
   * @param {string|null} [options.code]
   * @param {Array} [options.errors]
   * @param {boolean} [options.isOperational]
   * @param {Error|null} [options.cause]
   */
  constructor({
    message,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    code = null,
    errors = [],
    isOperational = true,
    cause = null,
  }) {
    super(message);

    this.name = this.constructor.name;

    this.statusCode = statusCode;

    this.code = code;

    this.errors = Array.isArray(errors) ? errors : [];

    this.isOperational = isOperational;

    this.cause = cause;

    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Creates a Bad Request error.
   */
  static badRequest(
    message,
    {
      errors = [],
      code = "BAD_REQUEST",
      cause = null,
      isOperational = true,
    } = {},
  ) {
    return new AppError({
      message,
      statusCode: StatusCodes.BAD_REQUEST,
      errors,
      code,
      cause,
      isOperational,
    });
  }

  /**
   * Creates an Unauthorized error.
   */
  static unauthorized(
    message,
    {
      code = "UNAUTHORIZED",
      cause = null,
      isOperational = true,
    } = {},
  ) {
    return new AppError({
      message,
      statusCode: StatusCodes.UNAUTHORIZED,
      code,
      cause,
      isOperational,
    });
  }

  /**
   * Creates a Forbidden error.
   */
  static forbidden(
  message,
  {
    cause = null,
    code = "FORBIDDEN",
    isOperational = true,
  } = {},
) {
    return new AppError({
      message,
      statusCode: StatusCodes.FORBIDDEN,
      code,
      cause,
      isOperational,
    });
  }

  /**
   * Creates a Not Found error.
   */
  static notFound(
  message,
  {
    cause = null,
    code = "NOT_FOUND",
    isOperational = true,
  } = {},
) {
    return new AppError({
      message,
      statusCode: StatusCodes.NOT_FOUND,
      code,
      cause,
      isOperational,
    });
  }

  /**
   * Creates a Conflict error.
   */
  static conflict(
  message,
  {
    cause = null,
    code = "CONFLICT",
    isOperational = true,
  } = {},
) {
    return new AppError({
      message,
      statusCode: StatusCodes.CONFLICT,
      code,
      cause,
      isOperational,
    });
  }

  /**
   * Creates a Validation error.
   */
  static validation(
    message,
    errors = [],
    { cause = null, code = "VALIDATION_FAILED" } = {},
  ) {
    return new AppError({
      message,
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      errors,
      cause,
      code,
    });
  }

  /**
   * Creates an Internal Server Error.
   */
  static internal(
    message = "Internal server error.",
    { cause = null, code = "INTERNAL_SERVER_ERROR" } = {},
  ) {
    return new AppError({
      message,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      cause,
      code,
      isOperational: false,
    });
  }
}

export default AppError;
