/**
 * ============================================================================
 * Request Logger Middleware
 * ============================================================================
 *
 * Registers HTTP request logging using Morgan integrated with Winston.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Generate a unique request ID for every request.
 * • Expose request ID via:
 *      - req.requestId
 *      - res.locals.requestId
 * • Log HTTP request metadata.
 * • Safely log request payloads in non-production environments.
 * • Never log authentication credentials or token material.
 *
 * This middleware intentionally does NOT:
 * • Perform authentication.
 * • Log business events.
 * • Modify request payloads.
 * • Handle errors.
 *
 * ============================================================================
 */

import crypto from "node:crypto";

import morgan from "morgan";

import appConfig from "../config/app.config.js";
import logger from "../config/logger.js";

/**
 * Morgan stream forwarding logs into Winston.
 */
const morganStream = Object.freeze({
  write(message) {
    logger.http(message.trim());
  },
});

/**
 * Fields that must never appear in HTTP request logs.
 */
const SENSITIVE_FIELDS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "accessToken",
  "refreshToken",
  "token",
  "authorization",
  "cookie",
]);

/**
 * Recursively redact sensitive object properties.
 *
 * @param {*} value
 * @returns {*}
 */
function redactSensitiveData(value) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      redactSensitiveData(item),
    );
  }

  if (
    value === null ||
    typeof value !== "object"
  ) {
    return value;
  }

  const redacted = {};

  for (const [key, currentValue] of Object.entries(value)) {
    if (SENSITIVE_FIELDS.has(key)) {
      redacted[key] = "[REDACTED]";
      continue;
    }

    redacted[key] = redactSensitiveData(
      currentValue,
    );
  }

  return redacted;
}

/**
 * Generates a unique request identifier.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function assignRequestId(req, res, next) {
  const requestId = crypto.randomUUID();

  req.requestId = requestId;
  res.locals.requestId = requestId;

  next();
}

/**
 * Morgan token: Request ID
 */
morgan.token("request-id", (req) => {
  return req.requestId ?? "unknown";
});

/**
 * Morgan token: Remote IP
 */
morgan.token("remote-ip", (req) => req.ip);

/**
 * Morgan token: Authenticated User
 */
morgan.token("user", (req) => {
  return req.auth?.userId ?? "anonymous";
});

/**
 * Morgan token: Request Body
 *
 * Request bodies are logged only outside production.
 *
 * Sensitive fields are always recursively redacted.
 */
morgan.token("body", (req) => {
  if (
    appConfig.app.environment === "production"
  ) {
    return "[REDACTED]";
  }

  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    return "";
  }

  try {
    return JSON.stringify(
      redactSensitiveData(req.body),
    );
  } catch {
    return "[UNAVAILABLE]";
  }
});

/**
 * Morgan format.
 */
const developmentFormat = [
  ":request-id",
  ":remote-ip",
  ":method",
  ":url",
  ":status",
  ":response-time ms",
  ":user-agent",
  "user=:user",
  "body=:body",
].join(" | ");

/**
 * Production format intentionally excludes request bodies.
 */
const productionFormat = [
  ":request-id",
  ":remote-ip",
  ":method",
  ":url",
  ":status",
  ":response-time ms",
  ":user-agent",
  "user=:user",
].join(" | ");

/**
 * Creates request logger middleware.
 *
 * @returns {import("express").RequestHandler[]}
 */
export default function configureRequestLogger() {
  const isProduction =
    appConfig.app.environment === "production";

  return [
    assignRequestId,

    morgan(
      isProduction
        ? productionFormat
        : developmentFormat,
      {
        stream: morganStream,
      },
    ),
  ];
}