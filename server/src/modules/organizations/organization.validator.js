import { z } from "zod";

const uuidSchema = z.uuid();

const codeSchema = z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(
        /^[a-z][a-z0-9_-]*$/,
        "Organization code must start with a lowercase letter and contain only lowercase letters, numbers, underscores or hyphens.",
    );

const nameSchema = z
    .string()
    .trim()
    .min(2)
    .max(150);

const optionalText = (max) =>
    z
        .string()
        .trim()
        .max(max)
        .nullable()
        .optional();

const statusSchema = z.enum([
    "active",
    "inactive",
]);

const booleanQuerySchema = z.preprocess(
    (value) => {
        if (value === undefined) return undefined;
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
    },
    z.boolean().optional(),
);

const organizationListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: statusSchema.optional(),
}).strict();

const organizationIdParamSchema = z.object({
    organizationId: uuidSchema,
}).strict();

const createOrganizationSchema = z.object({
    code: codeSchema,
    name: nameSchema,
    description: optionalText(2000),
    email: z.string().trim().email().max(320).nullable().optional(),
    phone: optionalText(30),
    website: optionalText(255),
    addressLine1: optionalText(255),
    addressLine2: optionalText(255),
    city: optionalText(100),
    state: optionalText(100),
    postalCode: optionalText(20),
    country: optionalText(100),
}).strict();

const updateOrganizationSchema = createOrganizationSchema
    .omit({ code: true })
    .extend({
        status: statusSchema.optional(),
    })
    .partial()
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        {
            message: "At least one organization field must be provided.",
        },
    );

const organizationValidator = Object.freeze({
    organizationListQuerySchema,
    organizationIdParamSchema,
    createOrganizationSchema,
    updateOrganizationSchema,
});

export default organizationValidator;
