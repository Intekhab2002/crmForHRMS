import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import contactController from "./contact.controller.js";
import contactValidator from "./contact.validator.js";

const {
    authenticate,
} = authMiddleware;

const {
    requirePermission,
} = rbacMiddleware;

const {
    TICKET_CREATE,
} = RBAC_PERMISSIONS;

const router = Router();

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

router.get(
    "/:organizationId/by-mobile/:mobile",
    authenticate,
    requirePermission(TICKET_CREATE),
    validateParams(
        contactValidator.mobileLookupParamSchema
    ),
    contactController.getContactByMobile,
);

export default router;