/**
 * CRM for HRMS - Role Management Validators
 */

import { z } from "zod";

const roleIdSchema = z.string().uuid();
const userIdSchema = z.string().uuid();
const permissionIdSchema = z.string().uuid();

const roleCodeSchema = z
    .string()
    .trim()
    .min(2, "Role code must contain at least 2 characters.")
    .max(50, "Role code must not exceed 50 characters.")
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "Role code may contain only lowercase letters, numbers and underscores and must start with a letter.",
    )
    .transform((value) => value.toLowerCase());

const roleNameSchema = z
    .string()
    .trim()
    .min(2, "Role name must contain at least 2 characters.")
    .max(100, "Role name must not exceed 100 characters.");

const descriptionSchema = z
    .string()
    .trim()
    .max(2000, "Role description must not exceed 2000 characters.")
    .nullable()
    .optional();

const positiveIntegerQuery = z
    .string()
    .regex(/^\d+$/, "Value must be a positive integer.")
    .transform(Number)
    .refine(
        (value) => Number.isSafeInteger(value) && value >= 1,
        "Value must be a positive integer.",
    );

const roleListQuerySchema = z
    .object({
        page: positiveIntegerQuery.optional().default("1"),
        limit: positiveIntegerQuery.optional().default("20"),
        search: z.string().trim().max(100).optional(),
        isActive: z.enum(["true", "false"]).optional().transform(
            (value) => value === undefined ? undefined : value === "true",
        ),
        isSystem: z.enum(["true", "false"]).optional().transform(
            (value) => value === undefined ? undefined : value === "true",
        ),
    })
    .strict()
    .superRefine((value, context) => {
        if (value.limit > 100) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["limit"],
                message: "Limit must not exceed 100.",
            });
        }
    });

const createRoleSchema = z.object({
    code: roleCodeSchema,
    name: roleNameSchema,
    description: descriptionSchema,
}).strict();

const updateRoleSchema = z.object({
    name: roleNameSchema.optional(),
    description: descriptionSchema,
    isActive: z.boolean().optional(),
}).strict().refine(
    (value) => Object.keys(value).length > 0,
    "At least one role field must be provided.",
);

const roleIdParamSchema = z.object({
    roleId: roleIdSchema,
}).strict();

const roleUserParamSchema = z.object({
    roleId: roleIdSchema,
    userId: userIdSchema,
}).strict();

const replacePermissionsSchema = z.object({
    permissionIds: z
        .array(permissionIdSchema)
        .max(200, "A role cannot contain more than 200 permissions.")
        .refine(
            (ids) => new Set(ids).size === ids.length,
            "Duplicate permission IDs are not allowed.",
        ),
}).strict();

const roleValidator = Object.freeze({
    roleListQuerySchema,
    createRoleSchema,
    updateRoleSchema,
    roleIdParamSchema,
    roleUserParamSchema,
    replacePermissionsSchema,
});

export {
    roleListQuerySchema,
    createRoleSchema,
    updateRoleSchema,
    roleIdParamSchema,
    roleUserParamSchema,
    replacePermissionsSchema,
};

export default roleValidator;
