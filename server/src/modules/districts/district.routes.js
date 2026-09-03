import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import districtController from "./district.controller.js";
import districtValidator from "./district.validator.js";

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
        districtValidator
            .districtListQuerySchema,
    ),
    districtController
        .getDistricts,
);

router.get(
    "/:districtId",
    authenticate,
    requirePermission(
        OPTION_READ,
    ),
    validateParams(
        districtValidator
            .districtIdParamSchema,
    ),
    districtController
        .getDistrict,
);

router.post(
    "/",
    authenticate,
    requirePermission(
        OPTION_CREATE,
    ),
    validateBody(
        districtValidator
            .createDistrictSchema,
    ),
    districtController
        .createDistrict,
);

router.patch(
    "/:districtId",
    authenticate,
    requirePermission(
        OPTION_UPDATE,
    ),
    validateParams(
        districtValidator
            .districtIdParamSchema,
    ),
    validateBody(
        districtValidator
            .updateDistrictSchema,
    ),
    districtController
        .updateDistrict,
);

router.delete(
    "/:districtId",
    authenticate,
    requirePermission(
        OPTION_DELETE,
    ),
    validateParams(
        districtValidator
            .districtIdParamSchema,
    ),
    districtController
        .deleteDistrict,
);

export default router;