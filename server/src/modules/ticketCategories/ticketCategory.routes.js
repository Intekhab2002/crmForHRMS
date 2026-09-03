import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import ticketCategoryController from "./ticketCategory.controller.js";
import ticketCategoryValidator from "./ticketCategory.validator.js";

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
        ticketCategoryValidator
            .ticketCategoryListQuerySchema,
    ),
    ticketCategoryController
        .getTicketCategories,
);

router.get(
    "/:ticketCategoryId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        ticketCategoryValidator
            .ticketCategoryIdParamSchema,
    ),
    ticketCategoryController
        .getTicketCategory,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        ticketCategoryValidator
            .createTicketCategorySchema,
    ),
    ticketCategoryController
        .createTicketCategory,
);

router.patch(
    "/:ticketCategoryId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        ticketCategoryValidator
            .ticketCategoryIdParamSchema,
    ),
    validateBody(
        ticketCategoryValidator
            .updateTicketCategorySchema,
    ),
    ticketCategoryController
        .updateTicketCategory,
);

router.delete(
    "/:ticketCategoryId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        ticketCategoryValidator
            .ticketCategoryIdParamSchema,
    ),
    ticketCategoryController
        .deleteTicketCategory,
);

export default router;