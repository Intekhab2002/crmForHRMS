import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import ticketCommentController
    from "./ticketComment.controller.js";

import ticketCommentValidator
    from "./ticketComment.validator.js";

const router = Router();

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
    TICKET_READ,
    TICKET_COMMENT,
} = RBAC_PERMISSIONS;

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

router.get(
    "/:ticketId/comments",
    authenticate,
    requirePermission(TICKET_READ),
    validateParams(
        ticketCommentValidator.ticketIdParamSchema,
    ),
    ticketCommentController.getComments,
);

router.post(
    "/:ticketId/comments",
    authenticate,
    requirePermission(TICKET_COMMENT),
    validateParams(
        ticketCommentValidator.ticketIdParamSchema,
    ),
    validateBody(
        ticketCommentValidator.createCommentSchema,
    ),
    ticketCommentController.createComment,
);

export default router;