/**
 * CRM for HRMS - Role Management Routes
 */

import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import roleController from "./role.controller.js";
import roleValidator from "./role.validator.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

function validate(schema, source) {
    return (req, res, next) => {
        try {
            req[source] = schema.parse(req[source]);
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validate(roleValidator.roleListQuerySchema, "query"),
    roleController.getRoles,
);

router.post(
    "/",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_CREATE),
    validate(roleValidator.createRoleSchema, "body"),
    roleController.createRole,
);

router.get(
    "/:roleId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validate(roleValidator.roleIdParamSchema, "params"),
    roleController.getRoleById,
);

router.patch(
    "/:roleId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validate(roleValidator.roleIdParamSchema, "params"),
    validate(roleValidator.updateRoleSchema, "body"),
    roleController.updateRole,
);

router.delete(
    "/:roleId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.ROLE_DELETE,
    ),
    validate(
        roleValidator.roleIdParamSchema,
        "params",
    ),
    roleController.deleteRole,
);

router.get(
    "/:roleId/permissions/matrix",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.ROLE_READ,
    ),
    validate(
        roleValidator.roleIdParamSchema,
        "params",
    ),
    roleController.getRolePermissionMatrix,
);

router.get(
    "/:roleId/permissions",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validate(roleValidator.roleIdParamSchema, "params"),
    roleController.getRolePermissions,
);

router.put(
    "/:roleId/permissions",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validate(roleValidator.roleIdParamSchema, "params"),
    validate(roleValidator.replacePermissionsSchema, "body"),
    roleController.replaceRolePermissions,
);

router.get(
    "/:roleId/users",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validate(roleValidator.roleIdParamSchema, "params"),
    roleController.getRoleUsers,
);

router.post(
    "/:roleId/users/:userId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validate(roleValidator.roleUserParamSchema, "params"),
    roleController.assignRoleToUser,
);

router.delete(
    "/:roleId/users/:userId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validate(roleValidator.roleUserParamSchema, "params"),
    roleController.removeRoleFromUser,
);

export default router;
