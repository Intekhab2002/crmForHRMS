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
        OPTION_READ,
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
        OPTION_CREATE,
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
        OPTION_UPDATE,
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
        OPTION_DELETE,
    ),
    validateParams(
        ticketDependencyCategoryValidator
            .ticketDependencyCategoryIdParamSchema,
    ),
    ticketDependencyCategoryController
        .deleteTicketDependencyCategory,
);

export default router;