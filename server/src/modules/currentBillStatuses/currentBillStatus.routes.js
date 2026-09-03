import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import currentBillStatusController from "./currentBillStatus.controller.js";
import currentBillStatusValidator from "./currentBillStatus.validator.js";

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
        currentBillStatusValidator
            .currentBillStatusListQuerySchema,
    ),
    currentBillStatusController
        .getcurrentBillStatus,
);

router.get(
    "/:currentBillStatusId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        currentBillStatusValidator
            .currentBillStatusIdParamSchema,
    ),
    currentBillStatusController
        .getCurrentBillStatus,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        currentBillStatusValidator
            .createCurrentBillStatusSchema,
    ),
    currentBillStatusController
        .createCurrentBillStatus,
);

router.patch(
    "/:currentBillStatusId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        currentBillStatusValidator
            .currentBillStatusIdParamSchema,
    ),
    validateBody(
        currentBillStatusValidator
            .updateCurrentBillStatusSchema,
    ),
    currentBillStatusController
        .updateCurrentBillStatus,
);

router.delete(
    "/:currentBillStatusId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        currentBillStatusValidator
            .currentBillStatusIdParamSchema,
    ),
    currentBillStatusController
        .deleteCurrentBillStatus,
);

export default router;