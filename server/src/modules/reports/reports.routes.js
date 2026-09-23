import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";

import controller from "./reports.controller.js";
import validator from "./reports.validator.js";
import { REPORT_PERMISSIONS } from "./reports.constants.js";

const router = Router();
const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const body = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

const params = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    next(error);
  }
};

const query = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (error) {
    next(error);
  }
};

router.get(
  "/",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.READ),
  controller.definitions,
);

router.get(
  "/runs",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.READ),
  query(validator.listRunsSchema),
  controller.runs,
);

router.get(
  "/:reportCode",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.READ),
  params(validator.reportCodeParamSchema),
  controller.definition,
);

router.post(
  "/:reportCode/preview",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.READ),
  params(validator.reportCodeParamSchema),
  body(validator.previewSchema),
  controller.preview,
);

router.post(
  "/:reportCode/generate",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.GENERATE),
  params(validator.reportCodeParamSchema),
  body(validator.generateSchema),
  controller.generate,
);

router.get(
  "/runs/:runId",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.READ),
  params(validator.runIdParamSchema),
  controller.run,
);

router.get(
  "/runs/:runId/artifacts/:artifactType",
  authenticate,
  requirePermission(REPORT_PERMISSIONS.DOWNLOAD),
  params(validator.artifactParamSchema),
  controller.download,
);

export default router;
