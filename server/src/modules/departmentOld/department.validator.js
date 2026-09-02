import { z } from "zod";

const uuidSchema = z.uuid();

const codeSchema = z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(
        /^[A-Z][A-Z0-9_-]*$/,
        "Department code must start with a uppercase letter and contain only uppercase letters, numbers, underscores or hyphens.",
    );

const nameSchema = z
    .string()
    .trim()
    .min(2)
    .max(150);

const statusSchema = z.enum([
    "active",
    "inactive",
]);

const optionalText = z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional();

const departmentListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    organizationId: uuidSchema.optional(),
    parentDepartmentId: uuidSchema.optional(),
    search: z.string().trim().max(100).optional(),
    status: statusSchema.optional(),
}).strict();

const departmentIdParamSchema = z.object({
    departmentId: uuidSchema,
}).strict();

const createDepartmentSchema = z.object({
    organizationId: uuidSchema,
    parentDepartmentId: uuidSchema.nullable().optional(),
    code: codeSchema,
    name: nameSchema,
    description: optionalText,
}).strict();

const updateDepartmentSchema = z.object({
    parentDepartmentId: uuidSchema.nullable().optional(),
    name: nameSchema.optional(),
    description: optionalText,
    status: statusSchema.optional(),
}).strict().refine(
    (value) => Object.keys(value).length > 0,
    {
        message: "At least one department field must be provided.",
    },
);

export default Object.freeze({
    departmentListQuerySchema,
    departmentIdParamSchema,
    createDepartmentSchema,
    updateDepartmentSchema,
});
