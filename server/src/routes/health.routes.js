/**
 * ============================================================================
 * Health Routes
 * ============================================================================
 *
 * File: src/routes/health.routes.js
 *
 * Description:
 * Provides application liveness and dependency readiness endpoints.
 *
 * Endpoints:
 *
 * GET /health
 *     Application liveness.
 *
 * GET /health/ready
 *     Application readiness including PostgreSQL availability.
 *
 * These endpoints are intended for:
 * - Load balancers
 * - Docker
 * - Kubernetes
 * - Monitoring systems
 * - DevOps infrastructure
 *
 * Route handlers are intentionally thin. Health-related logic belongs to the
 * health service.
 * ============================================================================
 */

import express from "express";
import { StatusCodes } from "http-status-codes";

import { ApiResponse } from "../helpers/ApiResponse.js";
import healthService from "../services/health.service.js";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "../constants/index.js";

const router = express.Router();

/**
 * ============================================================================
 * Liveness
 * ============================================================================
 *
 * GET /health
 *
 * Determines whether the application process is alive.
 *
 * This endpoint intentionally does not depend on PostgreSQL.
 */
router.get("/", (req, res) => {
  const liveness = healthService.getLiveness();

  return ApiResponse.success(
    res,
    liveness,
    SUCCESS_MESSAGES.HEALTH_CHECK,
  );
});

/**
 * ============================================================================
 * Readiness
 * ============================================================================
 *
 * GET /health/ready
 *
 * Determines whether the application is ready to serve requests.
 *
 * PostgreSQL is currently the only required infrastructure dependency.
 */
router.get("/ready", async (req, res, next) => {
  try {
    const readiness = await healthService.getReadiness();

    if (readiness.status !== "READY") {
      return ApiResponse.error(
        res,
        StatusCodes.SERVICE_UNAVAILABLE,
        ERROR_MESSAGES.SERVICE_NOT_READY,
        [],
        "SERVICE_UNAVAILABLE",
        {
          checks: readiness.checks,
        },
      );
    }

    return ApiResponse.success(
      res,
      readiness,
      SUCCESS_MESSAGES.READINESS_CHECK,
    );
  } catch (error) {
    return next(error);
  }
});

export default router;
