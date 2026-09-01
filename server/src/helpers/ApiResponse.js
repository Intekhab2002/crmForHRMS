/**
 * ============================================================================
 * API Response Helper
 * ============================================================================
 *
 * Standardizes all HTTP responses across the CRM for HRMS application.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Build consistent success responses.
 * • Build consistent error responses.
 * • Send Express responses.
 *
 * This helper intentionally contains NO:
 * • Business logic
 * • Database logic
 * • Logging
 * • Validation
 * • Authentication
 *
 * ============================================================================
 */

import { StatusCodes } from "http-status-codes";

import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "../constants/index.js";

/**
 * Returns the current UTC timestamp.
 *
 * @returns {string}
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Builds framework-level response metadata.
 *
 * Request ID is automatically propagated from Express response locals.
 * Explicit metadata takes precedence over framework metadata.
 *
 * @param {import("express").Response} response
 * @param {Record<string, unknown>} [meta={}]
 *
 * @returns {Record<string, unknown>|undefined}
 */
const buildMeta = (response, meta = {}) => {
  const frameworkMeta = {};

  if (response?.locals?.requestId) {
    frameworkMeta.requestId = response.locals.requestId;
  }

  const mergedMeta = {
    ...frameworkMeta,
    ...meta,
  };

  return Object.keys(mergedMeta).length > 0
    ? mergedMeta
    : undefined;
};

/**
 * Builds a standardized success payload.
 *
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 * @param {Record<string, unknown>} meta
 * @param {import("express").Response} response
 *
 * @returns {Record<string, unknown>}
 */
const buildSuccessPayload = (
  statusCode,
  message,
  data,
  meta,
  response,
) => {
  const payload = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: getTimestamp(),
  };

  const metadata = buildMeta(response, meta);

  if (metadata) {
    payload.meta = metadata;
  }

  return payload;
};

/**
 * Builds a standardized error payload.
 *
 * @param {number} statusCode
 * @param {string} message
 * @param {Array<unknown>} errors
 * @param {string|null} code
 * @param {import("express").Response} response
 * @param {Record<string, unknown>} meta
 *
 * @returns {Record<string, unknown>}
 */
const buildErrorPayload = (
  statusCode,
  message,
  errors,
  code,
  response,
  meta = {},
) => {
  const payload = {
    success: false,
    statusCode,
    message,
    timestamp: getTimestamp(),
  };

  if (code) {
    payload.code = code;
  }

  if (Array.isArray(errors) && errors.length > 0) {
    payload.errors = errors;
  }

  const metadata = buildMeta(response, meta);

  if (metadata) {
    payload.meta = metadata;
  }

  return payload;
};

/**
 * Sends a standardized HTTP response.
 *
 * This is intentionally private. Public consumers should use the semantic
 * methods exposed by ApiResponse.
 *
 * @param {import("express").Response} response
 * @param {number} statusCode
 * @param {Record<string, unknown>} payload
 *
 * @returns {import("express").Response}
 */
const send = (response, statusCode, payload) => {
  if (
    response &&
    typeof response.once === "function"
  ) {
    response.once("finish", () => {
      console.log("LOGIN_TRACE_12_RESPONSE_FINISHED");
    });

    response.once("close", () => {
      console.log("LOGIN_TRACE_13_RESPONSE_CLOSED");
    });
  }

  console.log("LOGIN_TRACE_10_RESPONSE_JSON_CALLING");

  const result = response
    .status(statusCode)
    .json(payload);

  console.log("LOGIN_TRACE_11_RESPONSE_JSON_RETURNED");

  return result;
};

/**
 * ============================================================================
 * Public API Response Interface
 * ============================================================================
 */

export const ApiResponse = Object.freeze({
  /**
   * Sends a successful response.
   */
  success(
    response,
    data = null,
    message = SUCCESS_MESSAGES.SUCCESS,
    meta = {},
  ) {
    return send(
      response,
      StatusCodes.OK,
      buildSuccessPayload(
        StatusCodes.OK,
        message,
        data,
        meta,
        response,
      ),
    );
  },

  /**
   * Sends a resource-created response.
   */
  created(
    response,
    data = null,
    message = SUCCESS_MESSAGES.CREATED,
    meta = {},
  ) {
    return send(
      response,
      StatusCodes.CREATED,
      buildSuccessPayload(
        StatusCodes.CREATED,
        message,
        data,
        meta,
        response,
      ),
    );
  },

  /**
   * Sends an updated-resource response.
   */
  updated(
    response,
    data = null,
    message = SUCCESS_MESSAGES.UPDATED,
    meta = {},
  ) {
    return send(
      response,
      StatusCodes.OK,
      buildSuccessPayload(
        StatusCodes.OK,
        message,
        data,
        meta,
        response,
      ),
    );
  },

  /**
   * Sends a deleted-resource response.
   */
  deleted(
    response,
    data = null,
    message = SUCCESS_MESSAGES.DELETED,
    meta = {},
  ) {
    return send(
      response,
      StatusCodes.OK,
      buildSuccessPayload(
        StatusCodes.OK,
        message,
        data,
        meta,
        response,
      ),
    );
  },

  /**
   * Sends a paginated response.
   *
   * Pagination metadata is merged with framework metadata such as requestId.
   */
  paginated(
    response,
    data,
    pagination = {},
    message = SUCCESS_MESSAGES.FETCHED,
  ) {
    return send(
      response,
      StatusCodes.OK,
      buildSuccessPayload(
        StatusCodes.OK,
        message,
        data,
        pagination,
        response,
      ),
    );
  },

  /**
   * Sends an HTTP 204 No Content response.
   */
  noContent(response) {
    return response.sendStatus(StatusCodes.NO_CONTENT);
  },

  /**
   * Sends a generic standardized error response.
   *
   * Used primarily by the global error middleware.
   */
  error(
    response,
    statusCode,
    message,
    errors = [],
    code = null,
    meta = {},
  ) {
    return send(
      response,
      statusCode,
      buildErrorPayload(
        statusCode,
        message,
        errors,
        code,
        response,
        meta,
      ),
    );
  },

  /**
   * Sends a 400 Bad Request response.
   */
  badRequest(
    response,
    message = ERROR_MESSAGES.BAD_REQUEST,
    errors = [],
    code = null,
  ) {
    return send(
      response,
      StatusCodes.BAD_REQUEST,
      buildErrorPayload(
        StatusCodes.BAD_REQUEST,
        message,
        errors,
        code,
        response,
      ),
    );
  },

  /**
   * Sends a 401 Unauthorized response.
   */
  unauthorized(
    response,
    message = ERROR_MESSAGES.UNAUTHORIZED,
    errors = [],
    code = null,
  ) {
    return send(
      response,
      StatusCodes.UNAUTHORIZED,
      buildErrorPayload(
        StatusCodes.UNAUTHORIZED,
        message,
        errors,
        code,
        response,
      ),
    );
  },

  /**
   * Sends a 403 Forbidden response.
   */
  forbidden(
    response,
    message = ERROR_MESSAGES.FORBIDDEN,
    errors = [],
    code = null,
  ) {
    return send(
      response,
      StatusCodes.FORBIDDEN,
      buildErrorPayload(
        StatusCodes.FORBIDDEN,
        message,
        errors,
        code,
        response,
      ),
    );
  },

  /**
   * Sends a 404 Not Found response.
   */
  notFound(
    response,
    message = ERROR_MESSAGES.NOT_FOUND,
    errors = [],
    code = null,
  ) {
    return send(
      response,
      StatusCodes.NOT_FOUND,
      buildErrorPayload(
        StatusCodes.NOT_FOUND,
        message,
        errors,
        code,
        response,
      ),
    );
  },

  /**
   * Sends a 409 Conflict response.
   */
  conflict(
    response,
    message = ERROR_MESSAGES.CONFLICT,
    errors = [],
    code = null,
  ) {
    return send(
      response,
      StatusCodes.CONFLICT,
      buildErrorPayload(
        StatusCodes.CONFLICT,
        message,
        errors,
        code,
        response,
      ),
    );
  },

  /**
   * Sends a 422 Validation Error response.
   */
  validationError(
    response,
    errors = [],
    message = ERROR_MESSAGES.VALIDATION_FAILED,
    code = null,
  ) {
    return send(
      response,
      StatusCodes.UNPROCESSABLE_ENTITY,
      buildErrorPayload(
        StatusCodes.UNPROCESSABLE_ENTITY,
        message,
        errors,
        code,
        response,
      ),
    );
  },

  /**
   * Sends a 500 Internal Server Error response.
   */
  internalServerError(
    response,
    message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    errors = [],
    code = null,
  ) {
    return send(
      response,
      StatusCodes.INTERNAL_SERVER_ERROR,
      buildErrorPayload(
        StatusCodes.INTERNAL_SERVER_ERROR,
        message,
        errors,
        code,
        response,
      ),
    );
  },
});

export default ApiResponse;