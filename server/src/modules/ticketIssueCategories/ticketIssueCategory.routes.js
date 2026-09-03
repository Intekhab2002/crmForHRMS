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
        OPTION_READ,
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
        OPTION_CREATE,
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
        OPTION_UPDATE,
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
        OPTION_DELETE,
    ),
    validateParams(
        ticketIssueCategoryValidator
            .ticketIssueCategoryIdParamSchema,
    ),
    ticketIssueCategoryController
        .deleteTicketIssueCategory,
);

export default router;