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
    SERVICE_TYPE_READ,
    SERVICE_TYPE_CREATE,
    SERVICE_TYPE_UPDATE,
    SERVICE_TYPE_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        SERVICE_TYPE_READ,
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
        SERVICE_TYPE_READ,
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
        SERVICE_TYPE_CREATE,
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
        SERVICE_TYPE_UPDATE,
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
        SERVICE_TYPE_DELETE,
    ),
    validateParams(
        serviceTypeValidator
            .serviceTypeIdParamSchema,
    ),
    serviceTypeController
        .deleteServiceType,
);

export default router;