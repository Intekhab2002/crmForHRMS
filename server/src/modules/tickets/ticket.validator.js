import { z } from "zod";

import {
  getField,
  TICKET_CONFIG,
  TICKET_COLUMN_FILTER_OPERATORS,
} from "./ticket.config.js";
import { SLA_STATUS } from "../sla/sla.constants.js";

const uuidSchema = z.string().uuid();
const uuidArraySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? value : [value];
}, z.array(uuidSchema).min(1).max(100));

const slaStatusValues = Object.values(SLA_STATUS);

const slaStatusArraySchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  },
  z.array(z.enum(slaStatusValues)).min(1).max(slaStatusValues.length),
);

const nonNegativeHoursQuery = z
  .union([z.string().trim().min(1).transform(Number), z.number()])
  .pipe(
    z
      .number()
      .finite()
      .min(0, "SLA remaining hours cannot be negative.")
      .max(100000, "SLA remaining hours is outside the supported range."),
  );

const stringSchema = (field) => {
  let schema = z.string().trim();

  if (field.maxLength) {
    schema = schema.max(
      field.maxLength,
      `${field.label} must not exceed ${field.maxLength} characters.`,
    );
  }

  if (field.required) {
    schema = schema.min(1, `${field.label} is required.`);
  }

  return schema;
};

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a valid date in YYYY-MM-DD format.");

const columnFilterItemSchema = z
  .object({
    field: z.string().trim().min(1).max(100),

    operator: z.enum(TICKET_COLUMN_FILTER_OPERATORS),

    value: z
      .union([z.string().max(5000), z.array(z.string().max(255)).max(100)])
      .optional(),
  })
  .strict();

const columnFilterModelSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      // Keep malformed JSON invalid so Zod rejects the request.
      return value;
    }
  },
  z
    .object({
      items: z.array(columnFilterItemSchema).max(20),
      logicOperator: z.enum(["and", "or"]).optional(),
    })
    .strict(),
);

const billReferenceLookupParamSchema = z
  .object({
    billReferenceNo: z.string().trim().min(1).max(100),
  })
  .strict();

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
    (value) => field.options.some((option) => option.value === value),
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
    if (!field.required || partial || field.key === "created_by") {
      schema = schema.optional().nullable();
    }

    shape[field.key] = schema;
  }

  return z.object(shape).strict();
}

const ticketIdParamSchema = z
  .object({
    ticketId: uuidSchema,
  })
  .strict();

const ticketAttachmentParamSchema = z
  .object({
    ticketId: uuidSchema,
    attachmentId: uuidSchema,
  })
  .strict();

const positiveIntegerQuery = z
  .string()
  .regex(/^\d+$/, "Value must be a positive integer.")
  .transform(Number)
  .refine(
    (value) => Number.isSafeInteger(value) && value >= 1,
    "Value must be a positive integer.",
  );

const ticketListFilterSchema = z
  .object({
    /*
     * Global search intentionally remains limited to the existing
     * high-value ticket fields. Structured filters below are used
     * when the user explicitly selects a field.
     */
    search: z.string().trim().max(255).optional(),

    columnFilters: columnFilterModelSchema.optional(),

    /*
     * UUID lookup filters
     */
    status: uuidArraySchema.optional(),
    departmentId: uuidArraySchema.optional(),
    assignedUserId: uuidArraySchema.optional(),
    contactId: uuidArraySchema.optional(),
    organizationId: uuidArraySchema.optional(),
    requesterUserId: uuidArraySchema.optional(),
    serviceTypeId: uuidArraySchema.optional(),
    categoryId: uuidArraySchema.optional(),
    problemStatementId: uuidArraySchema.optional(),
    currentBillStatusId: uuidArraySchema.optional(),
    severityId: uuidArraySchema.optional(),
    issueCategoryId: uuidArraySchema.optional(),
    dependencyCategoryId: uuidArraySchema.optional(),
    createdByUserId: uuidArraySchema.optional(),
    districtId: uuidArraySchema.optional(),

    /*
     * Text filters
     */
    ticketNumber: z.string().trim().max(32).optional(),

    subject: z.string().trim().max(255).optional(),

    employeeId: z.string().trim().max(100).optional(),

    employeeCurrentOfficeNameId: z.string().trim().max(100).optional(),

    billReferenceNo: z.string().trim().max(100).optional(),

    duplicateTicket: z.string().trim().max(255).optional(),

    letterNo: z.string().trim().max(100).optional(),

    priority: z.string().trim().max(50).optional(),

    mobileNumber: z.string().trim().max(30).optional(),

    name: z.string().trim().max(255).optional(),

    description: z.string().trim().max(5000).optional(),

    initialDiagnosis: z.string().trim().max(5000).optional(),

    solution: z.string().trim().max(5000).optional(),

    /*
     * SLA filters
     */
    slaStatus: slaStatusArraySchema.optional(),
    slaRemainingHoursMin: nonNegativeHoursQuery.optional(),
    slaRemainingHoursMax: nonNegativeHoursQuery.optional(),

    /*
     * Date filters
     */
    expectedResolutionDateFrom: dateSchema.optional(),

    expectedResolutionDateTo: dateSchema.optional(),

    createdFrom: dateSchema.optional(),

    createdTo: dateSchema.optional(),

    updatedFrom: dateSchema.optional(),

    updatedTo: dateSchema.optional(),
  })
  .strict();

const ticketListQuerySchema = ticketListFilterSchema
  .extend({
    page: positiveIntegerQuery.optional().default("1"),

    limit: positiveIntegerQuery.optional().default("20"),
  })
  .strict()
  .superRefine((value, context) => {
    for (const [index, item] of (value.columnFilters?.items ?? []).entries()) {
      const itemPath = ["columnFilters", "items", index];

      // Only configured SQL expressions may be used in ticket filters.
      if (!TICKET_CONFIG.columnFilterDefinitions[item.field]) {
        context.addIssue({
          code: "custom",
          path: [...itemPath, "field"],
          message: `Unsupported ticket column filter field: ${item.field}`,
        });

        continue;
      }

      // Operators that do not require a comparison value.
      if (["isEmpty", "isNotEmpty"].includes(item.operator)) {
        // MUI may omit the value or provide an empty string.
        // A non-empty value or an array is invalid for these operators.
        if (
          (typeof item.value === "string" && item.value !== "") ||
          Array.isArray(item.value)
        ) {
          context.addIssue({
            code: "custom",
            path: [...itemPath, "value"],
            message: `${item.operator} does not accept a comparison value.`,
          });
        }

        continue;
      }

      // isAnyOf requires a non-empty array of valid string values.
      if (item.operator === "isAnyOf") {
        if (
          !Array.isArray(item.value) ||
          item.value.length === 0 ||
          item.value.some(
            (entry) => typeof entry !== "string" || entry.trim() === "",
          )
        ) {
          context.addIssue({
            code: "custom",
            path: [...itemPath, "value"],
            message: "isAnyOf requires a non-empty array of non-empty strings.",
          });
        }

        continue;
      }

      // All other operators require a single non-empty string.
      if (typeof item.value !== "string" || item.value.trim() === "") {
        context.addIssue({
          code: "custom",
          path: [...itemPath, "value"],
          message: `${item.operator} requires a non-empty string value.`,
        });
      }
    }
    if (value.limit > 100) {
      context.addIssue({
        code: "custom",
        path: ["limit"],
        message: "Limit must not exceed 100.",
      });
    }

    if (
      value.createdFrom &&
      value.createdTo &&
      value.createdFrom > value.createdTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["createdFrom"],
        message: "createdFrom must not be later than createdTo.",
      });
    }

    if (
      value.updatedFrom &&
      value.updatedTo &&
      value.updatedFrom > value.updatedTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["updatedFrom"],
        message: "updatedFrom must not be later than updatedTo.",
      });
    }

    if (
      value.expectedResolutionDateFrom &&
      value.expectedResolutionDateTo &&
      value.expectedResolutionDateFrom > value.expectedResolutionDateTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["expectedResolutionDateFrom"],
        message:
          "expectedResolutionDateFrom must not be later than expectedResolutionDateTo.",
      });
    }

    if (
      value.slaRemainingHoursMin !== undefined &&
      value.slaRemainingHoursMax !== undefined &&
      value.slaRemainingHoursMin > value.slaRemainingHoursMax
    ) {
      context.addIssue({
        code: "custom",
        path: ["slaRemainingHoursMin"],
        message:
          "slaRemainingHoursMin must not be greater than slaRemainingHoursMax.",
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

const bulkUpdateSchema = z
  .object({
    ticketIds: z.array(uuidSchema).min(1).max(100),
    changes: updateTicketSchema,
    expectedUpdatedAt: z.record(uuidSchema, z.string().min(1)).optional(),
  })
  .strict();

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

    if (!field.options?.length || value === null || value === undefined) {
      continue;
    }

    if (!field.options.some((option) => option.value === value)) {
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
  ticketListFilterSchema,
  bulkUpdateSchema,
  billReferenceLookupParamSchema,
});
