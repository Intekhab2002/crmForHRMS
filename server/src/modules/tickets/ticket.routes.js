import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import ticketController from "./ticket.controller.js";
import ticketValidator from "./ticket.validator.js";

import ticketCommentController from "../ticketComments/ticketComment.controller.js";

import ticketCommentValidator from "../ticketComments/ticketComment.validator.js";

import ticketAttachmentController from "./ticketAttachment.controller.js";

import { ticketAttachmentUpload } from "./ticketAttachment.upload.js";

import ticketLifecycleController from "./ticketLifecycle.controller.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
  TICKET_READ,
  TICKET_CREATE,
  TICKET_UPDATE,
  TICKET_COMMENT,
  TICKET_ATTACHMENT,
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

router.get(
  "/:ticketId/comments",
  authenticate,
  requirePermission(TICKET_READ),
  validateParams(ticketCommentValidator.ticketIdParamSchema),
  ticketCommentController.getComments,
);

router.post(
  "/:ticketId/comments",
  authenticate,
  requirePermission(TICKET_COMMENT),
  validateParams(ticketCommentValidator.ticketIdParamSchema),
  validateBody(ticketCommentValidator.createCommentSchema),
  ticketCommentController.createComment,
);

router.get(
  "/:ticketId/lifecycle",
  authenticate,
  requirePermission(TICKET_READ),
  validateParams(ticketValidator.ticketIdParamSchema),
  ticketLifecycleController.getLifecycle,
);

router.get(
  "/:ticketId/attachments",
  authenticate,
  requirePermission(TICKET_READ),
  validateParams(ticketValidator.ticketIdParamSchema),
  ticketAttachmentController.listAttachments,
);

router.post(
  "/:ticketId/attachments",
  authenticate,
  requirePermission(TICKET_ATTACHMENT),
  validateParams(ticketValidator.ticketIdParamSchema),
  ticketAttachmentUpload.single("file"),
  ticketAttachmentController.uploadAttachment,
);

router.get(
  "/:ticketId/attachments/:attachmentId/view",
  authenticate,
  requirePermission(TICKET_ATTACHMENT),
  validateParams(ticketValidator.ticketIdParamSchema),
  ticketAttachmentController.viewAttachment,
);

router.get(
  "/:ticketId/attachments/:attachmentId/download",
  authenticate,
  requirePermission(TICKET_ATTACHMENT),
  validateParams(ticketValidator.ticketIdParamSchema),
  ticketAttachmentController.downloadAttachment,
);

router.delete(
  "/:ticketId/attachments/:attachmentId",
  authenticate,
  requirePermission(TICKET_ATTACHMENT),
  validateParams(ticketValidator.ticketIdParamSchema),
  ticketAttachmentController.deleteAttachment,
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
