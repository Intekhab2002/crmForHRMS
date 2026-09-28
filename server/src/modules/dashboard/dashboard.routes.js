import { Router } from "express";
import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import controller from "./dashboard.controller.js";
import validator from "./dashboard.validator.js";
import {
  DASHBOARD_PERMISSION,
  DASHBOARD_TYPES,
} from "./dashboard.constants.js";

const router = Router();

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

/**
 * Validate request data and optionally enrich the validated result
 * with route-level context known during route registration.
 *
 * Dashboard routes are intentionally registered separately:
 *
 *     /operational
 *     /management
 *     /professional
 *     /executive
 *     /audit
 *
 * Therefore dashboardType is already known from the route definition and
 * must NOT be read from req.params.
 *
 * @param {import("zod").ZodType} schema
 * @param {"query"|"params"|"body"} target
 * @param {Record<string, unknown>} context
 *
 * @returns {import("express").RequestHandler}
 */
const validate =
  (
    schema,
    target = "query",
    context = {},
  ) =>
  (req, res, next) => {
    try {
      const source =
        target === "params"
          ? {
              ...req[target],
              ...context,
            }
          : req[target];

      const result = schema.parse(source);

      const enrichedResult =
        target === "params"
          ? {
              ...result,
              ...context,
            }
          : result;

      if (target === "query") {
        req.validatedQuery = enrichedResult;
      } else if (target === "params") {
        req.validatedParams = enrichedResult;
      } else {
        req.validatedBody = enrichedResult;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

const permissionByDashboard = (dashboardType) =>
  DASHBOARD_PERMISSION[dashboardType];

router.get(
  "/available",
  authenticate,
  controller.available,
);

for (const dashboardType of DASHBOARD_TYPES) {
  const permission =
    permissionByDashboard(dashboardType);

  /**
   * --------------------------------------------------------------------------
   * Dashboard
   * --------------------------------------------------------------------------
   *
   * Example:
   *     GET /dashboard/operational
   *
   * dashboardType is known from the route registration itself.
   */
  router.get(
    `/${dashboardType}`,
    authenticate,
    requirePermission(permission),
    validate(
      validator.dashboardQuerySchema,
    ),
    validate(
      validator.dashboardTypeParamSchema,
      "params",
      { dashboardType },
    ),
    controller.dashboard,
  );

  /**
   * --------------------------------------------------------------------------
   * Metric
   * --------------------------------------------------------------------------
   *
   * Example:
   *     GET /dashboard/operational/metrics/ticket_count
   *
   * metricCode comes from req.params.
   * dashboardType comes from the route registration.
   */
  router.get(
    `/${dashboardType}/metrics/:metricCode`,
    authenticate,
    requirePermission(permission),
    validate(
      validator.dashboardQuerySchema,
    ),
    validate(
      validator.metricCodeParamSchema,
      "params",
      { dashboardType },
    ),
    controller.metric,
  );

  /**
   * --------------------------------------------------------------------------
   * Get Layout
   * --------------------------------------------------------------------------
   */
  router.get(
    `/${dashboardType}/layout`,
    authenticate,
    requirePermission(permission),
    validate(
      validator.dashboardTypeParamSchema,
      "params",
      { dashboardType },
    ),
    controller.layout,
  );

  /**
   * --------------------------------------------------------------------------
   * Update Layout
   * --------------------------------------------------------------------------
   */
  router.put(
    `/${dashboardType}/layout`,
    authenticate,
    requirePermission(permission),
    validate(
      validator.dashboardTypeParamSchema,
      "params",
      { dashboardType },
    ),
    validate(
      validator.layoutSchema,
      "body",
    ),
    controller.updateLayout,
  );

  /**
   * --------------------------------------------------------------------------
   * Reset Layout
   * --------------------------------------------------------------------------
   */
  router.post(
    `/${dashboardType}/layout/reset`,
    authenticate,
    requirePermission(permission),
    validate(
      validator.dashboardTypeParamSchema,
      "params",
      { dashboardType },
    ),
    controller.resetLayout,
  );
}

export default router;