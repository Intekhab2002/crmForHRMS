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
    TICKET_SEVERITY_READ,
    TICKET_SEVERITY_CREATE,
    TICKET_SEVERITY_UPDATE,
    TICKET_SEVERITY_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        TICKET_SEVERITY_READ,
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
        TICKET_SEVERITY_READ,
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
        TICKET_SEVERITY_CREATE,
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
        TICKET_SEVERITY_UPDATE,
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
        TICKET_SEVERITY_DELETE,
    ),
    validateParams(
        ticketSeverityValidator
            .ticketSeverityIdParamSchema,
    ),
    ticketSeverityController
        .deleteTicketSeverity,
);

export default router;