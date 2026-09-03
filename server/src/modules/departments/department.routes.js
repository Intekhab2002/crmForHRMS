import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import departmentController from "./department.controller.js";
import departmentValidator from "./department.validator.js";

import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middleware/validation.middleware.js";

const {
    authenticate,
} = authMiddleware;

const {
    requirePermission,
} = rbacMiddleware;

const {
    OPTION_READ,
    OPTION_CREATE,
    OPTION_UPDATE,
    OPTION_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateQuery(
        departmentValidator
            .departmentListQuerySchema,
    ),
    departmentController
        .getDepartments,
);

router.get(
    "/:departmentId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        departmentValidator
            .departmentIdParamSchema,
    ),
    departmentController
        .getDepartment,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        departmentValidator
            .createDepartmentSchema,
    ),
    departmentController
        .createDepartment,
);

router.patch(
    "/:departmentId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        departmentValidator
            .departmentIdParamSchema,
    ),
    validateBody(
        departmentValidator
            .updateDepartmentSchema,
    ),
    departmentController
        .updateDepartment,
);

router.delete(
    "/:departmentId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        departmentValidator
            .departmentIdParamSchema,
    ),
    departmentController
        .deleteDepartment,
);

export default router;