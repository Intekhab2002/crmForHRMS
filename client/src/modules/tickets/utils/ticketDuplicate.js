
import { TICKET_FORM_CONFIG } from "../../../config/ticket.config";

const EXCLUDED_FIELDS = new Set([
  "id",
  "ticketNumber",
  "ticket_number",
  "created_by",
  "createdBy",
  "created_by_user_id",
]);

/**
 * Builds initial values for a new ticket from an existing ticket.
 *
 * Only fields configured for ticket creation are copied.
 * Identity and creator fields are deliberately excluded.
 * TicketForm will populate created_by from the authenticated user.
 */
export function buildDuplicateTicketValues(sourceTicket) {
  if (!sourceTicket || typeof sourceTicket !== "object") {
    throw new TypeError("A valid source ticket is required.");
  }

  return TICKET_FORM_CONFIG.create.fields.reduce((values, field) => {
    if (EXCLUDED_FIELDS.has(field.key)) {
      return values;
    }

    const sourceValue = sourceTicket[field.key];

    // HTML date fields require YYYY-MM-DD, not a timestamp.
    values[field.key] =
      field.type === "date" && sourceValue
        ? String(sourceValue).slice(0, 10)
        : (sourceValue ?? "");

    return values;
  }, {});
}
