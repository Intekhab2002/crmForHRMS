import { z } from "zod";

import {
    FIELD_TYPES,
    FIELD_DATA_TYPES,
    FORM_STATUSES,
} from "./formConfiguration.constants.js";

const uuidSchema = z.uuid();

const fieldKeySchema = z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "Field key may contain lowercase letters, numbers and underscores and must start with a letter.",
    );

const nameSchema = z
    .string()
    .trim()
    .min(2)
    .max(150);

const labelSchema = z
    .string()
    .trim()
    .min(1)
    .max(200);

const optionalTextSchema = z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional();

const validationConfigSchema = z
    .object({
        required: z.boolean().optional(),
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(0).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        regexPattern: z.string().max(500).optional(),
        email: z.boolean().optional(),
        url: z.boolean().optional(),
        integer: z.boolean().optional(),
        decimal: z.boolean().optional(),
    })
    .strict();

const staticOptionSchema = z
    .object({
        label: z.string().trim().min(1).max(200),
        value: z.union([
            z.string(),
            z.number(),
        ]),
    })
    .strict();

const optionsConfigSchema = z
    .object({
        static: z
            .array(staticOptionSchema)
            .max(500)
            .optional(),

        dataSource: z
            .object({
                type: z.enum([
                    "api",
                    "static",
                ]),
                endpoint: z.string().trim().max(500).optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

const createFieldSchema = z
    .object({
        fieldKey: fieldKeySchema,

        name: nameSchema,

        label: labelSchema,

        description: optionalTextSchema,

        type: z.enum(FIELD_TYPES),

        dataType: z.enum(FIELD_DATA_TYPES),

        placeholder: z
            .string()
            .trim()
            .max(255)
            .nullable()
            .optional(),

        helpText: optionalTextSchema,

        defaultValue: z.unknown().optional(),

        status: z
            .enum(FORM_STATUSES)
            .default("active"),

        isVisible: z.boolean().default(true),

        isEnabled: z.boolean().default(true),

        isEditable: z.boolean().default(true),

        isReadOnly: z.boolean().default(false),

        isRequired: z.boolean().default(false),

        isSearchable: z.boolean().default(false),

        isFilterable: z.boolean().default(false),

        isSortable: z.boolean().default(false),

        validationConfig:
            validationConfigSchema.default({}),

        optionsConfig:
            optionsConfigSchema.default({}),
    })
    .strict();

const updateFieldSchema = createFieldSchema
    .partial()
    .omit({
        fieldKey: true,
    })
    .refine(
        (value) => Object.keys(value).length > 0,
        "At least one field property must be provided.",
    );

const fieldIdParamSchema = z
    .object({
        fieldId: uuidSchema,
    })
    .strict();

const fieldListQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),

        limit: z.coerce.number().int().min(1).max(100).default(20),

        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        type: z
            .enum(FIELD_TYPES)
            .optional(),

        status: z
            .enum(FORM_STATUSES)
            .optional(),

        includeDeleted: z
            .enum(["true", "false"])
            .transform((value) => value === "true")
            .default("false"),
    })
    .strict();

const formCodeSchema = z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(
        /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
        "Form code must use the format module.action.",
    );

const createFormSchema = z
    .object({
        code: formCodeSchema,

        name: nameSchema,

        module: z
            .string()
            .trim()
            .min(2)
            .max(100),

        description: optionalTextSchema,

        status: z
            .enum(FORM_STATUSES)
            .default("active"),
    })
    .strict();

const updateFormSchema = createFormSchema
    .partial()
    .omit({
        code: true,
    })
    .refine(
        (value) => Object.keys(value).length > 0,
        "At least one form property must be provided.",
    );

const formIdParamSchema = z
    .object({
        formId: uuidSchema,
    })
    .strict();



const formListQuerySchema = z
    .object({
        page: z.coerce
            .number()
            .int()
            .min(1)
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20),

        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        status: z
            .enum(FORM_STATUSES)
            .optional(),

        includeDeleted: z
            .enum(["true", "false"])
            .transform(
                (value) =>
                    value === "true",
            )
            .default("false"),
    })
    .strict();

const formIdentifierParamSchema = z
    .object({
        identifier: z
            .string()
            .trim()
            .min(3)
            .max(100),
    })
    .strict();

const assignFieldSchema = z
    .object({
        fieldId: uuidSchema,

        isVisible:
            z.boolean()
                .nullable()
                .optional(),

        isEnabled:
            z.boolean()
                .nullable()
                .optional(),

        isEditable:
            z.boolean()
                .nullable()
                .optional(),

        isReadOnly:
            z.boolean()
                .nullable()
                .optional(),

        isRequired:
            z.boolean()
                .nullable()
                .optional(),

        isSearchable:
            z.boolean()
                .nullable()
                .optional(),

        isFilterable:
            z.boolean()
                .nullable()
                .optional(),

        isSortable:
            z.boolean()
                .nullable()
                .optional(),

        displayOrder:
            z.number()
                .int()
                .min(0)
                .default(0),

        section:
            z.string()
                .trim()
                .max(100)
                .nullable()
                .optional(),

        gridSize:
            z.number()
                .int()
                .min(1)
                .max(12)
                .nullable()
                .optional(),

        columnWidth:
            z.number()
                .int()
                .min(1)
                .nullable()
                .optional(),

        labelOverride:
            z.string()
                .trim()
                .max(200)
                .nullable()
                .optional(),

        placeholderOverride:
            z.string()
                .trim()
                .max(255)
                .nullable()
                .optional(),

        helpTextOverride:
            z.string()
                .trim()
                .max(2000)
                .nullable()
                .optional(),

        defaultValueOverride:
            z.unknown()
                .optional(),
    })
    .strict();

const assignmentParamSchema = z
    .object({
        formId: uuidSchema,
        fieldId: uuidSchema,
    })
    .strict();

export default Object.freeze({
    createFieldSchema,
    updateFieldSchema,
    fieldIdParamSchema,
    fieldListQuerySchema,

    createFormSchema,
    updateFormSchema,
    formIdParamSchema,

    formListQuerySchema,
    formIdentifierParamSchema,

    assignFieldSchema,
    assignmentParamSchema,
});