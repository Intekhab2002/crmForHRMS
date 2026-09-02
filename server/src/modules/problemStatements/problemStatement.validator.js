import { z } from "zod";

const uuidSchema = z.uuid();

const codeSchema = z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
        /^[A-Z][A-Z0-9_-]*$/,
        "Problem statement code must start with an uppercase letter and contain only uppercase letters, numbers, underscores or hyphens.",
    );

const nameSchema = z
    .string()
    .trim()
    .min(2)
    .max(150);

const descriptionSchema = z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional();

const activeSchema = z.boolean();

const displayOrderSchema = z
    .coerce
    .number()
    .int()
    .min(0);

const problemStatementListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
}).strict();

const problemStatementIdParamSchema = z.object({
    problemStatementId: uuidSchema,
}).strict();

const createProblemStatementSchema = z.object({
    code: codeSchema,
    name: nameSchema,
    description: descriptionSchema,
    isActive: activeSchema.optional(),
    displayOrder: displayOrderSchema.optional(),
}).strict();

const updateProblemStatementSchema = z.object({
    code: codeSchema.optional(),
    name: nameSchema.optional(),
    description: descriptionSchema,
    isActive: activeSchema.optional(),
    displayOrder: displayOrderSchema.optional(),
}).strict().refine(
    (value) => Object.keys(value).length > 0,
    {
        message:
            "At least one problem statement field must be provided.",
    },
);

export default Object.freeze({
    problemStatementListQuerySchema,
    problemStatementIdParamSchema,
    createProblemStatementSchema,
    updateProblemStatementSchema,
});