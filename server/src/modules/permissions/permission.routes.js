/**
 * CRM for HRMS
 * Permission Management Routes
 */

import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import permissionController from "./permission.controller.js";
import permissionValidator from "./permission.validator.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
    PERMISSION_READ,
    PERMISSION_CREATE,
    PERMISSION_UPDATE,
    PERMISSION_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

function validateBody(schema) {
    return (request, response, next) => {
        try {
            request.body = schema.parse(
                request.body,
            );
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function validateParams(schema) {
    return (request, response, next) => {
        try {
            request.params = schema.parse(
                request.params,
            );
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function validateQuery(schema) {
    return (request, response, next) => {
        try {
            request.validatedQuery = schema.parse(
                request.query,
            );
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

router.get(
    "/",
    authenticate,
    requirePermission(PERMISSION_READ),
    validateQuery(
        permissionValidator.permissionListQuerySchema,
    ),
    permissionController.getPermissions,
);

router.get(
    "/:permissionId",
    authenticate,
    requirePermission(PERMISSION_READ),
    validateParams(
        permissionValidator.permissionIdParamSchema,
    ),
    permissionController.getPermissionById,
);

router.post(
    "/",
    authenticate,
    requirePermission(PERMISSION_CREATE),
    validateBody(
        permissionValidator.createPermissionSchema,
    ),
    permissionController.createPermission,
);

router.patch(
    "/:permissionId",
    authenticate,
    requirePermission(PERMISSION_UPDATE),
    validateParams(
        permissionValidator.permissionIdParamSchema,
    ),
    validateBody(
        permissionValidator.updatePermissionSchema,
    ),
    permissionController.updatePermission,
);

router.delete(
    "/:permissionId",
    authenticate,
    requirePermission(PERMISSION_DELETE),
    validateParams(
        permissionValidator.permissionIdParamSchema,
    ),
    permissionController.deletePermission,
);

export default router;
