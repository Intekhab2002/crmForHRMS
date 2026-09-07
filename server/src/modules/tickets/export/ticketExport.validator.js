import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z
  .string()
  .regex(DATE_PATTERN, "Expected a valid date in YYYY-MM-DD format.")
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    "Expected a valid calendar date.",
  );

const ticketExportSchema = z
  .object({
    fromDate: isoDateSchema,
    toDate: isoDateSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.fromDate > value.toDate) {
      context.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "toDate must be greater than or equal to fromDate.",
      });
    }
  });

export default Object.freeze({
  ticketExportSchema,
});
