import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import ticketStatusController from "./ticketStatus.controller.js";
import ticketStatusValidator from "./ticketStatus.validator.js";

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
    TICKET_STATUS_READ,
    TICKET_STATUS_CREATE,
    TICKET_STATUS_UPDATE,
    TICKET_STATUS_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        TICKET_STATUS_READ,
    ),
    validateQuery(
        ticketStatusValidator
            .ticketStatusListQuerySchema,
    ),
    ticketStatusController
        .getticketStatus,
);

router.get(
    "/:ticketStatusId",
    authenticate,
    requirePermission(
        TICKET_STATUS_READ,
    ),
    validateParams(
        ticketStatusValidator
            .ticketStatusIdParamSchema,
    ),
    ticketStatusController
        .getTicketStatus,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        TICKET_STATUS_CREATE,
    ),
    validateBody(
        ticketStatusValidator
            .createTicketStatusSchema,
    ),
    ticketStatusController
        .createTicketStatus,
);

router.patch(
    "/:ticketStatusId",
    authenticate,
    requirePermission(
        TICKET_STATUS_UPDATE,
    ),
    validateParams(
        ticketStatusValidator
            .ticketStatusIdParamSchema,
    ),
    validateBody(
        ticketStatusValidator
            .updateTicketStatusSchema,
    ),
    ticketStatusController
        .updateTicketStatus,
);

router.delete(
    "/:ticketStatusId",
    authenticate,
    requirePermission(
        TICKET_STATUS_DELETE,
    ),
    validateParams(
        ticketStatusValidator
            .ticketStatusIdParamSchema,
    ),
    ticketStatusController
        .deleteTicketStatus,
);

export default router;