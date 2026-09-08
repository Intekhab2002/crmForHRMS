import { z } from "zod";

import ticketValidator from "../ticket.validator.js";

const MAX_SELECTED_TICKETS = 10000;

const exportFiltersSchema = ticketValidator.ticketListFilterSchema;
const selectedExportSchema = z
  .object({
    mode: z.literal("selected"),

    ticketIds: z
      .array(z.string().uuid())
      .min(1, "At least one ticket must be selected.")
      .max(
        MAX_SELECTED_TICKETS,
        `A maximum of ${MAX_SELECTED_TICKETS} tickets can be exported at once.`,
      ),
  })
  .strict();

const filteredExportSchema = z
  .object({
    mode: z.literal("filtered"),

    filters: exportFiltersSchema,
  })
  .strict();

const allExportSchema = z
  .object({
    mode: z.literal("all"),
  })
  .strict();

const ticketExportSchema = z.discriminatedUnion("mode", [
  selectedExportSchema,
  filteredExportSchema,
  allExportSchema,
]);

export default Object.freeze({
  ticketExportSchema,
  exportFiltersSchema,
  selectedExportSchema,
  filteredExportSchema,
  allExportSchema,
  MAX_SELECTED_TICKETS,
});
