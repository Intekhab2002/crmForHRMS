import { z } from "zod";

const uuidSchema = z.uuid();

const mobileSchema = z
  .string()
  .trim()
  .min(5, "Mobile number must contain at least 5 characters.")
  .max(30, "Mobile number must not exceed 30 characters.");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Contact name is required.")
  .max(200);


const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

const contactIdParamSchema = z
  .object({ contactId: uuidSchema })
  .strict();

const organizationIdParamSchema = z
  .object({ organizationId: uuidSchema })
  .strict();

const mobileLookupParamSchema = z
  .object({
    organizationId: uuidSchema,
    mobilePhone: z.string().trim().min(1).max(30),
  })
  .strict();

const contactListQuerySchema = z
  .object({
    page: pageSchema,
    limit: limitSchema,
    search: z.string().trim().max(255).optional(),
    organizationId: uuidSchema.optional(),
    departmentId: uuidSchema.optional(),
    districtId: uuidSchema.optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

const createContactSchema = z
  .object({
    organizationId: uuidSchema,
    departmentId: uuidSchema.nullable().optional(),
    districtId: uuidSchema.nullable().optional(),
    name: nameSchema,
    mobilePhone: mobileSchema,
    email: z.string().trim().email().max(320).nullable().optional(),
  })
  .strict();

const updateContactSchema = z
  .object({
    organizationId: uuidSchema.optional(),
    departmentId: uuidSchema.nullable().optional(),
    districtId: uuidSchema.nullable().optional(),
    name: nameSchema.optional(),
    mobilePhone: mobileSchema.optional(),
    email: z.string().trim().email().max(320).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one contact field must be provided.",
  });

const contactValidator = Object.freeze({
  contactIdParamSchema,
  organizationIdParamSchema,
  mobileLookupParamSchema,
  contactListQuerySchema,
  createContactSchema,
  updateContactSchema,
});

export default contactValidator;