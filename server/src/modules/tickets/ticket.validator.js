
import { z } from "zod";

import { getField, TICKET_CONFIG } from "./ticket.config.js";

const uuidSchema = z.string().uuid();

const stringSchema = (field) => {
    let schema = z.string().trim();

    if (field.maxLength) {
        schema = schema.max(
            field.maxLength,
            `${field.label} must not exceed ${field.maxLength} characters.`,
        );
    }

    if (field.required) {
        schema = schema.min(
            1,
            `${field.label} is required.`,
        );
    }

    return schema;
};

const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Expected a valid date in YYYY-MM-DD format.",
);

function schemaForField(field) {
    if (field.dataType === "uuid") {
        return uuidSchema;
    }

    if (field.dataType === "date") {
        return dateSchema;
    }

    return stringSchema(field);
}

function applyOptions(schema, field) {
    /*
     * Static options are intentionally supported by the generic
     * configuration system, but the configurable ticket lookup
     * fields no longer define static options.
     *
     * Therefore:
     *
     *   - configurable lookup fields validate as UUIDs
     *   - static option fields can still use this mechanism
     */
    if (!field.options?.length) {
        return schema;
    }

    return schema.refine(
        (value) =>
            field.options.some(
                (option) => option.value === value,
            ),
        `${field.label} contains an invalid option.`,
    );
}

function createSchema({ partial = false } = {}) {
    const shape = {};

    for (const field of TICKET_CONFIG.fields) {
        if (!field.editable && field.key !== "created_by") {
            continue;
        }

        let schema = schemaForField(field);

        schema = applyOptions(schema, field);

        /*
         * Required fields remain required on create.
         *
         * On partial update every editable field becomes optional.
         *
         * created_by is internally populated by the authenticated
         * user and therefore remains optional from the request payload.
         */
        if (
            !field.required ||
            partial ||
            field.key === "created_by"
        ) {
            schema = schema.optional().nullable();
        }

        shape[field.key] = schema;
    }

    return z.object(shape).strict();
}

const ticketIdParamSchema = z.object({
    ticketId: uuidSchema,
}).strict();

const ticketAttachmentParamSchema = z
    .object({
        ticketId: uuidSchema,
        attachmentId: uuidSchema,
    })
    .strict();

const positiveIntegerQuery = z
    .string()
    .regex(
        /^\d+$/,
        "Value must be a positive integer.",
    )
    .transform(Number)
    .refine(
        (value) =>
            Number.isSafeInteger(value) &&
            value >= 1,
        "Value must be a positive integer.",
    );

const ticketListQuerySchema = z
    .object({
        page: positiveIntegerQuery
            .optional()
            .default("1"),

        limit: positiveIntegerQuery
            .optional()
            .default("20"),

        search: z
            .string()
            .trim()
            .max(255)
            .optional(),

        /*
         * Ticket status is now a UUID foreign key.
         *
         * Do not use TICKET_STATUS here because statuses are
         * configurable master data and are no longer hardcoded.
         */
        status: uuidSchema.optional(),

        departmentId: uuidSchema.optional(),

        assignedUserId: uuidSchema.optional(),

        contactId: uuidSchema.optional(),
    })
    .strict()
    .superRefine((value, context) => {
        if (value.limit > 100) {
            context.addIssue({
                code: "custom",
                path: ["limit"],
                message: "Limit must not exceed 100.",
            });
        }
    });

const createTicketSchema = createSchema();

const updateTicketSchema = createSchema({
    partial: true,
}).refine(
    (value) => Object.keys(value).length > 0,
    "At least one ticket field must be provided.",
);

export function validateConfiguredOptions(payload) {
    /*
     * Keep this function because it is part of the existing service
     * contract.
     *
     * Configurable lookup fields intentionally have no static options,
     * so they are validated as UUIDs by the generated Zod schemas and
     * their database existence/active state is validated by the service.
     *
     * This function remains useful for any future statically configured
     * ticket fields.
     */
    for (const [key, value] of Object.entries(payload)) {
        const field = getField(key);

        if (!field) {
            continue;
        }

        if (
            !field.options?.length ||
            value === null ||
            value === undefined
        ) {
            continue;
        }

        if (
            !field.options.some(
                (option) => option.value === value,
            )
        ) {
            return {
                field: key,
                message: `${field.label} contains an invalid option.`,
            };
        }
    }

    return null;
}

export default Object.freeze({
    ticketIdParamSchema,
    ticketAttachmentParamSchema,
    ticketListQuerySchema,
    createTicketSchema,
    updateTicketSchema,
    validateConfiguredOptions,
});

