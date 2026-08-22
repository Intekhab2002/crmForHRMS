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
    TICKET_DELETE,
    TICKET_ASSIGN,
    TICKET_RESOLVE,
    TICKET_CLOSE,
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
    "/:ticketId/comments",
    authenticate,
    requirePermission(TICKET_READ),
    validateParams(ticketValidator.ticketIdParamSchema),
    ticketController.getComments,
);

router.post(
    "/:ticketId/comments",
    authenticate,
    requirePermission(TICKET_UPDATE),
    validateParams(ticketValidator.ticketIdParamSchema),
    validateBody(ticketValidator.createCommentSchema),
    ticketController.addComment,
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

router.patch(
    "/:ticketId/assign",
    authenticate,
    requirePermission(TICKET_ASSIGN),
    validateParams(ticketValidator.ticketIdParamSchema),
    validateBody(ticketValidator.assignTicketSchema),
    ticketController.assignTicket,
);

router.patch(
    "/:ticketId/resolve",
    authenticate,
    requirePermission(TICKET_RESOLVE),
    validateParams(ticketValidator.ticketIdParamSchema),
    validateBody(ticketValidator.resolveTicketSchema),
    ticketController.resolveTicket,
);

router.patch(
    "/:ticketId/close",
    authenticate,
    requirePermission(TICKET_CLOSE),
    validateParams(ticketValidator.ticketIdParamSchema),
    ticketController.closeTicket,
);

router.patch(
    "/:ticketId/reopen",
    authenticate,
    requirePermission(TICKET_UPDATE),
    validateParams(ticketValidator.ticketIdParamSchema),
    ticketController.reopenTicket,
);

router.delete(
    "/:ticketId",
    authenticate,
    requirePermission(TICKET_DELETE),
    validateParams(ticketValidator.ticketIdParamSchema),
    ticketController.deleteTicket,
);

export default router;
