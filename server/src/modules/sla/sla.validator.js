import { z } from "zod";

const uuid = z.string().uuid();
const code = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9][a-z0-9_-]*$/);
const name = z.string().trim().min(1).max(150);
const fieldKey = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9_]*$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const uuidParamSchema = z.object({ id: uuid });
export const ticketSlaParamSchema = z.object({ ticketId: uuid });
export const calendarParamSchema = z.object({ calendarId: uuid });
export const policyRuleParamSchema = z.object({ policyId: uuid, ruleId: uuid });
export const calendarHolidayParamSchema = z.object({
  calendarId: uuid,
  holidayId: uuid,
});
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const policyParamSchema = z.object({
  policyId: uuid,
});
export const holidayListQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2200).optional(),
});
export const createCalendarSchema = z.object({
  code,
  name,
  timezone: z.string().trim().min(1).max(100).default("Asia/Kolkata"),
  businessHoursPerDay: z.number().positive().max(24).default(8),
  workdayStartTime: time.default("09:00"),
  workdayEndTime: time.default("17:00"),
  includeSaturday: z.boolean().default(false),
  includeSunday: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export const updateCalendarSchema = createCalendarSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");
export const createPolicySchema = z.object({
  code,
  name,
  description: z.string().trim().max(5000).nullable().optional(),
  triggerFieldKey: fieldKey,
  triggerValueKey: z.string().trim().min(1).max(100),
  durationFieldKey: fieldKey,
  calendarId: uuid,
  priority: z.number().int().min(0).default(100),
  effectiveFrom: z.string().datetime({ offset: true }).optional(),
  effectiveTo: z.string().datetime({ offset: true }).nullable().optional(),
  isActive: z.boolean().default(true),
});
export const updatePolicySchema = createPolicySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");
export const createRuleSchema = z.object({
  fieldValueKey: z.string().trim().min(1).max(100),
  resolutionMinutes: z.number().int().min(1).nullable(),
  isEnabled: z.boolean().default(true),
});
export const updateRuleSchema = createRuleSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");
export const createHolidaySchema = z.object({
  holidayDate: z.string().date(),
  name: z.string().trim().min(1).max(200),
  isActive: z.boolean().default(true),
});
export const updateHolidaySchema = createHolidaySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");
export const previewSchema = z.object({
  startAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(1),
  calendarId: uuid,
});
export default Object.freeze({
  uuidParamSchema,
  ticketSlaParamSchema,
  calendarParamSchema,
  policyRuleParamSchema,
  calendarHolidayParamSchema,
  listQuerySchema,
  holidayListQuerySchema,
  createCalendarSchema,
  updateCalendarSchema,
  createPolicySchema,
  updatePolicySchema,
  createRuleSchema,
  updateRuleSchema,
  createHolidaySchema,
  updateHolidaySchema,
  previewSchema,
  policyParamSchema,
});
