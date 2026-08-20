import { ZodError } from "zod";
import jwt from "jsonwebtoken";

import appConfig from "../config/app.config.js";
import logger from "../config/logger.js";

import ApiResponse from "../helpers/ApiResponse.js";
import AppError from "../helpers/AppError.js";

import {
  ERROR_MESSAGES,
} from "../constants/message.constants.js";


const {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} = jwt;

/**
 * ============================================================================
 * PostgreSQL Error Mapping
 * ============================================================================
 */

const POSTGRES_ERROR_MAP = Object.freeze({
  "23505": {
    statusCode: 409,
    message: ERROR_MESSAGES.CONFLICT ?? "Resource already exists.",
    code: "DATABASE_UNIQUE_VIOLATION",
  },

  "23503": {
    statusCode: 409,
    message: "Operation violates database relationship constraints.",
    code: "DATABASE_FOREIGN_KEY_VIOLATION",
  },

  "23502": {
    statusCode: 400,
    message: "Required database field is missing.",
    code: "DATABASE_NOT_NULL_VIOLATION",
  },

  "22P02": {
    statusCode: 400,
    message: "Invalid database input.",
    code: "DATABASE_INVALID_INPUT",
  },
});

/**
 * ============================================================================
 * Normalize Any Error Into AppError
 * ============================================================================
 *
 * @param {Error} error
 * @returns {AppError}
 */
function normalizeError(error) {
  /**
   * --------------------------------------------------------------------------
   * Already an AppError
   * --------------------------------------------------------------------------
   */
  if (error instanceof AppError) {
    return error;
  }

  /**
   * --------------------------------------------------------------------------
   * Zod Validation
   * --------------------------------------------------------------------------
   */
  if (error instanceof ZodError) {
    return AppError.validation(
      ERROR_MESSAGES.VALIDATION_FAILED ?? "Validation failed.",
      error.issues,
    );
  }

  /**
   * --------------------------------------------------------------------------
   * JWT Errors
   * --------------------------------------------------------------------------
   */

  if (error instanceof TokenExpiredError) {
    return AppError.unauthorized(
      ERROR_MESSAGES.TOKEN_EXPIRED ?? "Token has expired.",
    );
  }

  if (
    error instanceof JsonWebTokenError ||
    error instanceof NotBeforeError
  ) {
    return AppError.unauthorized(
      ERROR_MESSAGES.INVALID_TOKEN ?? "Invalid authentication token.",
    );
  }

  /**
   * --------------------------------------------------------------------------
   * PostgreSQL Errors
   * --------------------------------------------------------------------------
   */

  if (error?.code && POSTGRES_ERROR_MAP[error.code]) {
    const dbError = POSTGRES_ERROR_MAP[error.code];

    return new AppError({
      message: dbError.message,
      statusCode: dbError.statusCode,
      code: dbError.code,
      cause: error,
    });
  }

  /**
   * --------------------------------------------------------------------------
   * Unknown Error
   * --------------------------------------------------------------------------
   */

  return AppError.internal(
    ERROR_MESSAGES.INTERNAL_SERVER_ERROR ??
      "An unexpected error occurred.",
    {
      cause: error,
    },
  );
}

/**
 * ============================================================================
 * Error Middleware
 * ============================================================================
 *
 * Global centralized application error handler.
 *
 * Responsibilities:
 *
 * - Normalize all errors
 * - Log every error
 * - Hide sensitive information
 * - Preserve requestId
 * - Standardize API responses
 * - Return safe production responses
 *
 * Register this middleware LAST.
 *
 * @param {Error} error
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export default function errorMiddleware(
  error,
  req,
  res,
  next,
) {
  /**
   * Prevent duplicate responses.
   */
  if (res.headersSent) {
    return next(error);
  }

  const appError = normalizeError(error);

  const requestId =
    req.requestId ??
    res.locals.requestId ??
    null;

  /**
   * --------------------------------------------------------------------------
   * Structured Logging
   * --------------------------------------------------------------------------
   */

  logger.error({
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode: appError.statusCode,
    code: appError.code,
    message: appError.message,
    stack: appError.stack,
    cause: appError.cause,
  });

  /**
   * --------------------------------------------------------------------------
   * Response Payload
   * --------------------------------------------------------------------------
   */

  const meta = {
  requestId,
};

if (
  appConfig.app.environment === "development"
) {
  meta.stack = appError.stack;

  if (appError.cause) {
    meta.cause = appError.cause;
  }
}

return ApiResponse.error(
  res,
  appError.statusCode,
  appError.message,
  appError.errors,
  appError.code,
  meta,
);

}