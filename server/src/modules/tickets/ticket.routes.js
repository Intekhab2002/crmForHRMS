import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import ticketController from "./ticket.controller.js";
import ticketValidator from "./ticket.validator.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
    TICKET_READ,
    TICKET_CREATE,
    TICKET_UPDATE,
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
    requirePermission(TICKET_READ),
    validateQuery(ticketValidator.ticketListQuerySchema),
    ticketController.getTickets,
);

router.get(
    "/assignable-users",
    authenticate,
    requirePermission(TICKET_READ),
    ticketController.getAssignableUsers,
);

router.get(
    "/:ticketId",
    authenticate,
    requirePermission(TICKET_READ),
    validateParams(ticketValidator.ticketIdParamSchema),
    ticketController.getTicket,
);

router.post(
    "/",
    authenticate,
    requirePermission(TICKET_CREATE),
    validateBody(ticketValidator.createTicketSchema),
    ticketController.createTicket,
);

router.patch(
    "/:ticketId",
    authenticate,
    requirePermission(TICKET_UPDATE),
    validateParams(ticketValidator.ticketIdParamSchema),
    validateBody(ticketValidator.updateTicketSchema),
    ticketController.updateTicket,
);

export default router;
