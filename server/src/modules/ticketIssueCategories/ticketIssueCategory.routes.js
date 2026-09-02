import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import ticketIssueCategoryController from "./ticketIssueCategory.controller.js";
import ticketIssueCategoryValidator from "./ticketIssueCategory.validator.js";

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
    TICKET_ISSUE_CATEGORY_READ,
    TICKET_ISSUE_CATEGORY_CREATE,
    TICKET_ISSUE_CATEGORY_UPDATE,
    TICKET_ISSUE_CATEGORY_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        TICKET_ISSUE_CATEGORY_READ,
    ),
    validateQuery(
        ticketIssueCategoryValidator
            .ticketIssueCategoryListQuerySchema,
    ),
    ticketIssueCategoryController
        .getTicketCategories,
);

router.get(
    "/:ticketIssueCategoryId",
    authenticate,
    requirePermission(
        TICKET_ISSUE_CATEGORY_READ,
    ),
    validateParams(
        ticketIssueCategoryValidator
            .ticketIssueCategoryIdParamSchema,
    ),
    ticketIssueCategoryController
        .getTicketIssueCategory,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        TICKET_ISSUE_CATEGORY_CREATE,
    ),
    validateBody(
        ticketIssueCategoryValidator
            .createTicketIssueCategorySchema,
    ),
    ticketIssueCategoryController
        .createTicketIssueCategory,
);

router.patch(
    "/:ticketIssueCategoryId",
    authenticate,
    requirePermission(
        TICKET_ISSUE_CATEGORY_UPDATE,
    ),
    validateParams(
        ticketIssueCategoryValidator
            .ticketIssueCategoryIdParamSchema,
    ),
    validateBody(
        ticketIssueCategoryValidator
            .updateTicketIssueCategorySchema,
    ),
    ticketIssueCategoryController
        .updateTicketIssueCategory,
);

router.delete(
    "/:ticketIssueCategoryId",
    authenticate,
    requirePermission(
        TICKET_ISSUE_CATEGORY_DELETE,
    ),
    validateParams(
        ticketIssueCategoryValidator
            .ticketIssueCategoryIdParamSchema,
    ),
    ticketIssueCategoryController
        .deleteTicketIssueCategory,
);

export default router;