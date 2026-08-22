import { z } from "zod";

import { TICKET_PRIORITY, TICKET_STATUS } from "./ticket.constants.js";

const uuidSchema = z.string().uuid();

const nonEmptyString = (label, max) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must not exceed ${max} characters.`);

const positiveIntegerQuery = z
  .string()
  .regex(/^\d+$/, "Value must be a positive integer.")
  .transform(Number)
  .refine(
    (value) => Number.isSafeInteger(value) && value >= 1,
    "Value must be a positive integer.",
  );

const statusSchema = z.enum(Object.values(TICKET_STATUS));
const prioritySchema = z.enum(Object.values(TICKET_PRIORITY));

const ticketIdParamSchema = z
  .object({
    ticketId: uuidSchema,
  })
  .strict();

const ticketListQuerySchema = z
  .object({
    page: positiveIntegerQuery.optional().default("1"),
    limit: positiveIntegerQuery.optional().default("20"),
    search: z.string().trim().max(255).optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    organizationId: uuidSchema.optional(),
    departmentId: uuidSchema.optional(),
    requesterUserId: uuidSchema.optional(),
    assignedUserId: uuidSchema.optional(),
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

const createTicketSchema = z
  .object({
    subject: nonEmptyString("Subject", 255),

    description: z
      .string()
      .trim()
      .min(1, "Description is required."),

    issueType: nonEmptyString("Issue type", 100),

    priority: prioritySchema
      .optional()
      .default(TICKET_PRIORITY.MEDIUM),

    requesterUserId: uuidSchema.optional(),

    organizationId: uuidSchema,

    departmentId: uuidSchema,

    assignedUserId: uuidSchema.optional(),

    contactName: nonEmptyString(
      "Contact name",
      255,
    ),

    mobilePhone: nonEmptyString(
      "Mobile number",
      30,
    ),
  })
  .strict();

const updateTicketSchema = z
  .object({
    subject: nonEmptyString("Subject", 255).optional(),
    description: z.string().trim().min(1).optional(),
    issueType: nonEmptyString("Issue type", 100).optional(),
    priority: prioritySchema.optional(),
    organizationId: uuidSchema.optional(),
    departmentId: uuidSchema.optional(),
    assignedEmployeeId: uuidSchema.nullable().optional(),
    status: statusSchema.optional(),
    resolutionNote: z.string().trim().min(1).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one ticket field must be provided.",
  });

const assignTicketSchema = z
  .object({
    assignedUserId: uuidSchema,
  })
  .strict();

const resolveTicketSchema = z
  .object({
    resolutionNote: z.string().trim().min(1, "Resolution note is required."),
  })
  .strict();

export default Object.freeze({
  ticketIdParamSchema,
  ticketListQuerySchema,
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  resolveTicketSchema,
});
