import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import problemStatementController from "./problemStatement.controller.js";
import problemStatementValidator from "./problemStatement.validator.js";

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
        problemStatementValidator
            .problemStatementListQuerySchema,
    ),
    problemStatementController
        .getproblemStatement,
);

router.get(
    "/:problemStatementId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        problemStatementValidator
            .problemStatementIdParamSchema,
    ),
    problemStatementController
        .getProblemStatement,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        problemStatementValidator
            .createProblemStatementSchema,
    ),
    problemStatementController
        .createProblemStatement,
);

router.patch(
    "/:problemStatementId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        problemStatementValidator
            .problemStatementIdParamSchema,
    ),
    validateBody(
        problemStatementValidator
            .updateProblemStatementSchema,
    ),
    problemStatementController
        .updateProblemStatement,
);

router.delete(
    "/:problemStatementId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        problemStatementValidator
            .problemStatementIdParamSchema,
    ),
    problemStatementController
        .deleteProblemStatement,
);

export default router;