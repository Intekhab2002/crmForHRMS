import { Router } from "express";
import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import controller from "./dashboard.controller.js";
import validator from "./dashboard.validator.js";
import { DASHBOARD_PERMISSION, DASHBOARD_TYPES } from "./dashboard.constants.js";

const router = Router();
const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const validate = (schema, target = "query") => (req, res, next) => {
  try {
    const result = schema.parse(req[target]);
    if (target === "query") req.validatedQuery = result;
    else if (target === "params") req.validatedParams = result;
    else req.validatedBody = result;
    next();
  } catch (error) {
    next(error);
  }
};

const permissionByDashboard = (dashboardType) => DASHBOARD_PERMISSION[dashboardType];

router.get(
  "/available",
  authenticate,
  controller.available,
);

for (const dashboardType of DASHBOARD_TYPES) {
  const permission = permissionByDashboard(dashboardType);

  router.get(
    `/${dashboardType}`,
    authenticate,
    requirePermission(permission),
    validate(validator.dashboardQuerySchema),
    validate(validator.dashboardTypeParamSchema, "params"),
    controller.dashboard,
  );

  router.get(
    `/${dashboardType}/metrics/:metricCode`,
    authenticate,
    requirePermission(permission),
    validate(validator.dashboardQuerySchema),
    validate(validator.metricCodeParamSchema, "params"),
    controller.metric,
  );

  router.get(
    `/${dashboardType}/layout`,
    authenticate,
    requirePermission(permission),
    validate(validator.dashboardTypeParamSchema, "params"),
    controller.layout,
  );

  router.put(
    `/${dashboardType}/layout`,
    authenticate,
    requirePermission(permission),
    validate(validator.dashboardTypeParamSchema, "params"),
    validate(validator.layoutSchema, "body"),
    controller.updateLayout,
  );

  router.post(
    `/${dashboardType}/layout/reset`,
    authenticate,
    requirePermission(permission),
    validate(validator.dashboardTypeParamSchema, "params"),
    controller.resetLayout,
  );
}

export default router;
