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
    PROBLEM_STATEMENT_READ,
    PROBLEM_STATEMENT_CREATE,
    PROBLEM_STATEMENT_UPDATE,
    PROBLEM_STATEMENT_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        PROBLEM_STATEMENT_READ,
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
        PROBLEM_STATEMENT_READ,
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
        PROBLEM_STATEMENT_CREATE,
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
        PROBLEM_STATEMENT_UPDATE,
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
        PROBLEM_STATEMENT_DELETE,
    ),
    validateParams(
        problemStatementValidator
            .problemStatementIdParamSchema,
    ),
    problemStatementController
        .deleteProblemStatement,
);

export default router;