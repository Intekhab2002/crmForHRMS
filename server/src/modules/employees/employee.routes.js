import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import employeeController from "./employee.controller.js";
import employeeValidator from "./employee.validator.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;
const { EMPLOYEE_READ, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, EMPLOYEE_DELETE } = RBAC_PERMISSIONS;
const router = Router();

function validateBody(schema) {
    return (req, res, next) => {
        try { req.body = schema.parse(req.body); return next(); }
        catch (error) { return next(error); }
    };
}

function validateParams(schema) {
    return (req, res, next) => {
        try { req.params = schema.parse(req.params); return next(); }
        catch (error) { return next(error); }
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        try { req.validatedQuery = schema.parse(req.query); return next(); }
        catch (error) { return next(error); }
    };
}

router.get(
    "/",
    authenticate,
    requirePermission(EMPLOYEE_READ),
    validateQuery(employeeValidator.employeeListQuerySchema),
    employeeController.getEmployees,
);

router.get(
    "/:employeeId",
    authenticate,
    requirePermission(EMPLOYEE_READ),
    validateParams(employeeValidator.employeeIdParamSchema),
    employeeController.getEmployee,
);

router.post(
    "/",
    authenticate,
    requirePermission(EMPLOYEE_CREATE),
    validateBody(employeeValidator.createEmployeeSchema),
    employeeController.createEmployee,
);

router.patch(
    "/:employeeId",
    authenticate,
    requirePermission(EMPLOYEE_UPDATE),
    validateParams(employeeValidator.employeeIdParamSchema),
    validateBody(employeeValidator.updateEmployeeSchema),
    employeeController.updateEmployee,
);

router.delete(
    "/:employeeId",
    authenticate,
    requirePermission(EMPLOYEE_DELETE),
    validateParams(employeeValidator.employeeIdParamSchema),
    employeeController.deleteEmployee,
);

export default router;
