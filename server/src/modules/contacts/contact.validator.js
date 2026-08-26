import { z } from "zod";

const uuidSchema = z.uuid();

const mobileSchema = z
    .string()
    .trim()
    .min(5)
    .max(30);

const organizationIdParamSchema = z.object({
    organizationId: uuidSchema,
}).strict();

const mobileParamSchema = z.object({
    mobile: mobileSchema,
}).strict();

const contactValidator = Object.freeze({
    organizationIdParamSchema,
    mobileParamSchema,
});

const mobileLookupParamSchema = z.object({
  organizationId: z.uuid(),
  mobilePhone: z
    .string()
    .trim()
    .min(1)
    .max(30),
});

export default contactValidator;