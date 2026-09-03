import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import serviceTypeController from "./serviceType.controller.js";
import serviceTypeValidator from "./serviceType.validator.js";

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
        serviceTypeValidator
            .serviceTypeListQuerySchema,
    ),
    serviceTypeController
        .getServiceTypes,
);

router.get(
    "/:serviceTypeId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        serviceTypeValidator
            .serviceTypeIdParamSchema,
    ),
    serviceTypeController
        .getServiceType,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        serviceTypeValidator
            .createServiceTypeSchema,
    ),
    serviceTypeController
        .createServiceType,
);

router.patch(
    "/:serviceTypeId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        serviceTypeValidator
            .serviceTypeIdParamSchema,
    ),
    validateBody(
        serviceTypeValidator
            .updateServiceTypeSchema,
    ),
    serviceTypeController
        .updateServiceType,
);

router.delete(
    "/:serviceTypeId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        serviceTypeValidator
            .serviceTypeIdParamSchema,
    ),
    serviceTypeController
        .deleteServiceType,
);

export default router;