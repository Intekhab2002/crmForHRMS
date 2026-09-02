import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import ticketDependencyCategoryController from "./ticketDependencyCategory.controller.js";
import ticketDependencyCategoryValidator from "./ticketDependencyCategory.validator.js";

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
    TICKET_DEPENDENCY_CATEGORY_READ,
    TICKET_DEPENDENCY_CATEGORY_CREATE,
    TICKET_DEPENDENCY_CATEGORY_UPDATE,
    TICKET_DEPENDENCY_CATEGORY_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        TICKET_DEPENDENCY_CATEGORY_READ,
    ),
    validateQuery(
        ticketDependencyCategoryValidator
            .ticketDependencyCategoryListQuerySchema,
    ),
    ticketDependencyCategoryController
        .getTicketDependencyCategories,
);

router.get(
    "/:ticketDependencyCategoryId",
    authenticate,
    requirePermission(
        TICKET_DEPENDENCY_CATEGORY_READ,
    ),
    validateParams(
        ticketDependencyCategoryValidator
            .ticketDependencyCategoryIdParamSchema,
    ),
    ticketDependencyCategoryController
        .getTicketDependencyCategory,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        TICKET_DEPENDENCY_CATEGORY_CREATE,
    ),
    validateBody(
        ticketDependencyCategoryValidator
            .createTicketDependencyCategorySchema,
    ),
    ticketDependencyCategoryController
        .createTicketDependencyCategory,
);

router.patch(
    "/:ticketDependencyCategoryId",
    authenticate,
    requirePermission(
        TICKET_DEPENDENCY_CATEGORY_UPDATE,
    ),
    validateParams(
        ticketDependencyCategoryValidator
            .ticketDependencyCategoryIdParamSchema,
    ),
    validateBody(
        ticketDependencyCategoryValidator
            .updateTicketDependencyCategorySchema,
    ),
    ticketDependencyCategoryController
        .updateTicketDependencyCategory,
);

router.delete(
    "/:ticketDependencyCategoryId",
    authenticate,
    requirePermission(
        TICKET_DEPENDENCY_CATEGORY_DELETE,
    ),
    validateParams(
        ticketDependencyCategoryValidator
            .ticketDependencyCategoryIdParamSchema,
    ),
    ticketDependencyCategoryController
        .deleteTicketDependencyCategory,
);

export default router;