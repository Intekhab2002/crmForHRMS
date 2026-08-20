/**
 * CRM for HRMS
 * Permission Management Validation
 */

import { z } from "zod";

const uuidSchema = z.uuid();

const codeSchema = z
    .string()
    .trim()
    .min(3, "Permission code is required.")
    .max(100, "Permission code must not exceed 100 characters.")
    .regex(
        /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/,
        "Permission code must use the format resource:action.",
    );

const nameSchema = z
    .string()
    .trim()
    .min(2, "Permission name must contain at least 2 characters.")
    .max(150, "Permission name must not exceed 150 characters.");

const descriptionSchema = z
    .string()
    .trim()
    .max(1000, "Permission description must not exceed 1000 characters.")
    .nullable()
    .optional();

const resourceSchema = z
    .string()
    .trim()
    .min(1, "Permission resource is required.")
    .max(100, "Permission resource must not exceed 100 characters.")
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "Permission resource may contain lowercase letters, numbers and underscores.",
    );

const actionSchema = z
    .string()
    .trim()
    .min(1, "Permission action is required.")
    .max(50, "Permission action must not exceed 50 characters.")
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "Permission action may contain lowercase letters, numbers and underscores.",
    );

const booleanQuerySchema = z.preprocess(
    (value) => {
        if (value === undefined) {
            return undefined;
        }

        if (value === true || value === false) {
            return value;
        }

        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }

        return value;
    },
    z.boolean().optional(),
);

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const permissionListQuerySchema = paginationSchema
    .extend({
        search: z.string().trim().max(100).optional(),
        resource: resourceSchema.optional(),
        action: actionSchema.optional(),
        isActive: booleanQuerySchema,
        isSystem: booleanQuerySchema,
    })
    .strict();

const permissionIdParamSchema = z
    .object({
        permissionId: uuidSchema,
    })
    .strict();

const createPermissionSchema = z
    .object({
        code: codeSchema,
        name: nameSchema,
        description: descriptionSchema,
        resource: resourceSchema,
        action: actionSchema,
    })
    .strict();

const updatePermissionSchema = z
    .object({
        name: nameSchema.optional(),
        description: descriptionSchema,
        resource: resourceSchema.optional(),
        action: actionSchema.optional(),
    })
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        {
            message: "At least one permission field must be provided.",
        },
    );

const permissionValidator = Object.freeze({
    permissionListQuerySchema,
    permissionIdParamSchema,
    createPermissionSchema,
    updatePermissionSchema,
});

export {
    permissionListQuerySchema,
    permissionIdParamSchema,
    createPermissionSchema,
    updatePermissionSchema,
};

export default permissionValidator;
