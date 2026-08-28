/**
 * CRM for HRMS - Role Management Routes
 */

import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import roleController from "./role.controller.js";
import roleValidator from "./role.validator.js";

import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middleware/validation.middleware.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;


const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validateQuery(roleValidator.roleListQuerySchema,),
    roleController.getRoles,
);

router.post(
    "/",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_CREATE),
    validateBody(roleValidator.createRoleSchema),
    roleController.createRole,
);

router.get(
    "/:roleId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validateParams(roleValidator.roleIdParamSchema),
    roleController.getRoleById,
);

router.patch(
    "/:roleId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validateParams(roleValidator.roleIdParamSchema),
    validateBody(roleValidator.updateRoleSchema),
    roleController.updateRole,
);

router.delete(
    "/:roleId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.ROLE_DELETE,
    ),
    validateParams(
        roleValidator.roleIdParamSchema),
    roleController.deleteRole,
);

router.get(
    "/:roleId/permissions/matrix",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.ROLE_READ,
    ),
    validateParams(
        roleValidator.roleIdParamSchema
    ),
    roleController.getRolePermissionMatrix,
);

router.get(
    "/:roleId/permissions",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validateParams(roleValidator.roleIdParamSchema),
    roleController.getRolePermissions,
);

router.put(
    "/:roleId/permissions",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validateParams(roleValidator.roleIdParamSchema),
    validateBody(roleValidator.replacePermissionsSchema),
    roleController.replaceRolePermissions,
);

router.get(
    "/:roleId/users",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_READ),
    validateParams(roleValidator.roleIdParamSchema),
    roleController.getRoleUsers,
);

router.post(
    "/:roleId/users/:userId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validateParams(roleValidator.roleUserParamSchema),
    roleController.assignRoleToUser,
);

router.delete(
    "/:roleId/users/:userId",
    authenticate,
    requirePermission(RBAC_PERMISSIONS.ROLE_UPDATE),
    validateParams(roleValidator.roleUserParamSchema),
    roleController.removeRoleFromUser,
);

export default router;
