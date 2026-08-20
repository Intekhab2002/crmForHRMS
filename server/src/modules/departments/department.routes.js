import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import departmentController from "./department.controller.js";
import departmentValidator from "./department.validator.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
    DEPARTMENT_READ,
    DEPARTMENT_CREATE,
    DEPARTMENT_UPDATE,
    DEPARTMENT_DELETE,
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
    requirePermission(DEPARTMENT_READ),
    validateQuery(
        departmentValidator.departmentListQuerySchema,
    ),
    departmentController.getDepartments,
);

router.get(
    "/:departmentId",
    authenticate,
    requirePermission(DEPARTMENT_READ),
    validateParams(
        departmentValidator.departmentIdParamSchema,
    ),
    departmentController.getDepartment,
);

router.post(
    "/",
    authenticate,
    requirePermission(DEPARTMENT_CREATE),
    validateBody(
        departmentValidator.createDepartmentSchema,
    ),
    departmentController.createDepartment,
);

router.patch(
    "/:departmentId",
    authenticate,
    requirePermission(DEPARTMENT_UPDATE),
    validateParams(
        departmentValidator.departmentIdParamSchema,
    ),
    validateBody(
        departmentValidator.updateDepartmentSchema,
    ),
    departmentController.updateDepartment,
);

router.delete(
    "/:departmentId",
    authenticate,
    requirePermission(DEPARTMENT_DELETE),
    validateParams(
        departmentValidator.departmentIdParamSchema,
    ),
    departmentController.deleteDepartment,
);

export default router;
