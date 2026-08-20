import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import organizationController from "./organization.controller.js";
import organizationValidator from "./organization.validator.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
    ORGANIZATION_READ,
    ORGANIZATION_CREATE,
    ORGANIZATION_UPDATE,
    ORGANIZATION_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function validateParams(schema) {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.validatedQuery = schema.parse(req.query);
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

router.get(
    "/",
    authenticate,
    requirePermission(ORGANIZATION_READ),
    validateQuery(
        organizationValidator.organizationListQuerySchema,
    ),
    organizationController.getOrganizations,
);

router.get(
    "/:organizationId",
    authenticate,
    requirePermission(ORGANIZATION_READ),
    validateParams(
        organizationValidator.organizationIdParamSchema,
    ),
    organizationController.getOrganization,
);

router.post(
    "/",
    authenticate,
    requirePermission(ORGANIZATION_CREATE),
    validateBody(
        organizationValidator.createOrganizationSchema,
    ),
    organizationController.createOrganization,
);

router.patch(
    "/:organizationId",
    authenticate,
    requirePermission(ORGANIZATION_UPDATE),
    validateParams(
        organizationValidator.organizationIdParamSchema,
    ),
    validateBody(
        organizationValidator.updateOrganizationSchema,
    ),
    organizationController.updateOrganization,
);

router.delete(
    "/:organizationId",
    authenticate,
    requirePermission(ORGANIZATION_DELETE),
    validateParams(
        organizationValidator.organizationIdParamSchema,
    ),
    organizationController.deleteOrganization,
);

export default router;
