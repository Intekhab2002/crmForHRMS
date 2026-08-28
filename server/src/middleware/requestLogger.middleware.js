/**
 * ============================================================================
 * Request Logger Middleware
 * ============================================================================
 *
 * Registers HTTP request logging using Morgan integrated with Winston.
 *
 * Responsibilities
 * ----------------
 * • Generate a unique request ID for every request.
 * • Expose request ID via:
 *      - req.requestId
 *      - res.locals.requestId
 * • Log HTTP request metadata.
 * • Forward Morgan logs to Winston.
 *
 * This middleware intentionally does NOT:
 * • Perform authentication.
 * • Log business events.
 * • Modify request payloads.
 * • Handle errors.
 * * ============================================================================
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
 */
morgan.token("body", (req) => {
  if (appConfig.app.isProduction) {
    return "";
  }

  if (
    !req.body ||
    Object.keys(req.body).length === 0
  ) {
    return "";
  }

  return JSON.stringify(req.body);
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
  return [
    assignRequestId,
    morgan(
      appConfig.app.isProduction
        ? productionFormat
        : developmentFormat,
      {
        stream: morganStream,
      },
    ),
  ];
}