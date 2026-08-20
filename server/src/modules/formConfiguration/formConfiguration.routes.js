import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";

import rbacMiddleware from "../rbac/rbac.middleware.js";

import {
    RBAC_PERMISSIONS,
} from "../rbac/rbac.constants.js";

import controller from "./formConfiguration.controller.js";

import validator from "./formConfiguration.validator.js";

const router = Router();

const {
    authenticate,
} = authMiddleware;

const {
    requirePermission,
} = rbacMiddleware;

function validateBody(schema) {
    return (request, response, next) => {
        try {
            request.body =
                schema.parse(
                    request.body,
                );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function validateParams(schema) {
    return (request, response, next) => {
        try {
            request.params =
                schema.parse(
                    request.params,
                );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function validateQuery(schema) {
    return (request, response, next) => {
        try {
            request.validatedQuery =
                schema.parse(
                    request.query,
                );

            return next();
        } catch (error) {
            return next(error);
        }
    };
}


/**
 * GET /form-fields
 */
router.get(
    "/form-fields",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_READ,
    ),
    validateQuery(
        validator.fieldListQuerySchema,
    ),
    controller.getFields,
);


/**
 * GET /form-fields/:fieldId
 */
router.get(
    "/form-fields/:fieldId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_READ,
    ),
    validateParams(
        validator.fieldIdParamSchema,
    ),
    controller.getFieldById,
);


/**
 * POST /form-fields
 */
router.post(
    "/form-fields",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_CREATE,
    ),
    validateBody(
        validator.createFieldSchema,
    ),
    controller.createField,
);


/**
 * PATCH /form-fields/:fieldId
 */
router.patch(
    "/form-fields/:fieldId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_UPDATE,
    ),
    validateParams(
        validator.fieldIdParamSchema,
    ),
    validateBody(
        validator.updateFieldSchema,
    ),
    controller.updateField,
);


/**
 * POST /form-fields/:fieldId/disable
 */
router.post(
    "/form-fields/:fieldId/disable",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_DISABLE,
    ),
    validateParams(
        validator.fieldIdParamSchema,
    ),
    controller.disableField,
);

/**
 * POST /form-fields/:fieldId/enable
 */
router.post(
    "/form-fields/:fieldId/enable",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_ENABLE,
    ),
    validateParams(
        validator.fieldIdParamSchema,
    ),
    controller.enableField,
);


/**
 * DELETE /form-fields/:fieldId
 */
router.delete(
    "/form-fields/:fieldId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_DELETE,
    ),
    validateParams(
        validator.fieldIdParamSchema,
    ),
    controller.deleteField,
);


/**
 * POST /form-fields/:fieldId/restore
 */
router.post(
    "/form-fields/:fieldId/restore",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_FIELD_RESTORE,
    ),
    validateParams(
        validator.fieldIdParamSchema,
    ),
    controller.restoreField,
);

/**
 * ============================================================================
 * Form Definition APIs
 * ============================================================================
 */

/**
 * GET /forms
 */
router.get(
    "/forms",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_READ,
    ),
    validateQuery(
        validator.formListQuerySchema,
    ),
    controller.getForms,
);

/**
 * POST /forms
 */
router.post(
    "/forms",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_CREATE,
    ),
    validateBody(
        validator.createFormSchema,
    ),
    controller.createForm,
);

/**
 * GET /forms/:identifier
 *
 * UUID  -> administrative form definition
 * code  -> runtime form configuration
 *
 * Examples:
 * /forms/550e8400-e29b-41d4-a716-446655440000
 * /forms/ticket.create
 */
router.get(
    "/forms/:identifier",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_READ,
    ),
    validateParams(
        validator.formIdentifierParamSchema,
    ),
    controller.getFormByIdentifier,
);

/**
 * PATCH /forms/:formId
 */
router.patch(
    "/forms/:formId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_UPDATE,
    ),
    validateParams(
        validator.formIdParamSchema,
    ),
    validateBody(
        validator.updateFormSchema,
    ),
    controller.updateForm,
);

/**
 * DELETE /forms/:formId
 */
router.delete(
    "/forms/:formId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_DELETE,
    ),
    validateParams(
        validator.formIdParamSchema,
    ),
    controller.deleteForm,
);

/**
 * ============================================================================
 * Form Field Assignment APIs
 * ============================================================================
 */

/**
 * POST /forms/:formId/fields
 */
router.post(
    "/forms/:formId/fields",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_UPDATE,
    ),
    validateParams(
        validator.formIdParamSchema,
    ),
    validateBody(
        validator.assignFieldSchema,
    ),
    controller.assignField,
);

/**
 * DELETE /forms/:formId/fields/:fieldId
 */
router.delete(
    "/forms/:formId/fields/:fieldId",
    authenticate,
    requirePermission(
        RBAC_PERMISSIONS.FORM_DEFINITION_UPDATE,
    ),
    validateParams(
        validator.assignmentParamSchema,
    ),
    controller.removeField,
);

export default router;