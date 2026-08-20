import AppError from "../helpers/AppError.js";

/**
 * ============================================================================
 * Not Found Middleware
 * ============================================================================
 *
 * Handles all unmatched routes by forwarding a standardized 404 application
 * error to the global error handler.
 *
 * This middleware must be registered after all application routes.
 *
 * Flow:
 *
 * Request
 *    │
 *    ▼
 * No Route Matched
 *    │
 *    ▼
 * AppError.notFound()
 *    │
 *    ▼
 * Global Error Middleware
 *
 * Responsibilities:
 * - Handle unknown routes
 * - Preserve centralized error handling
 * - Avoid duplicate response formatting
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {void}
 */
export default function notFoundMiddleware(req, res, next) {
  next(
    AppError.notFound(
      `Route '${req.originalUrl}' does not exist.`,
    ),
  );
}