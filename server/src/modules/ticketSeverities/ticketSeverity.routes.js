import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import ticketSeverityController from "./ticketSeverity.controller.js";
import ticketSeverityValidator from "./ticketSeverity.validator.js";

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
        ticketSeverityValidator
            .ticketSeverityListQuerySchema,
    ),
    ticketSeverityController
        .getTicketSeverities,
);

router.get(
    "/:ticketSeverityId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        ticketSeverityValidator
            .ticketSeverityIdParamSchema,
    ),
    ticketSeverityController
        .getTicketSeverity,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        ticketSeverityValidator
            .createTicketSeveritySchema,
    ),
    ticketSeverityController
        .createTicketSeverity,
);

router.patch(
    "/:ticketSeverityId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        ticketSeverityValidator
            .ticketSeverityIdParamSchema,
    ),
    validateBody(
        ticketSeverityValidator
            .updateTicketSeveritySchema,
    ),
    ticketSeverityController
        .updateTicketSeverity,
);

router.delete(
    "/:ticketSeverityId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        ticketSeverityValidator
            .ticketSeverityIdParamSchema,
    ),
    ticketSeverityController
        .deleteTicketSeverity,
);

export default router;