/**
 * ============================================================================
 * File: publicTicketStatus.validator.js
 * Path: src/modules/publicTicketStatus/publicTicketStatus.validator.js
 * ============================================================================
 */

import { z } from "zod";

const createdDateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Created date must be in YYYY-MM-DD format.",
  );

const optionalIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320);

const publicTicketStatusSearchSchema = z
  .object({
    createdDate: createdDateSchema,

    ticketNumber: optionalIdentifierSchema.optional(),

    mobileNumber: optionalIdentifierSchema
      .max(30)
      .optional(),

    emailId: z
      .string()
      .trim()
      .email()
      .max(320)
      .optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(
        value.ticketNumber ||
        value.mobileNumber ||
        value.emailId,
      ),
    {
      message:
        "At least one of ticketNumber, mobileNumber or emailId must be provided.",
    },
  );

export default Object.freeze({
  publicTicketStatusSearchSchema,
});