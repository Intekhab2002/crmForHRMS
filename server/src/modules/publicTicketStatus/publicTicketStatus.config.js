/**
 * ============================================================================
 * File: publicTicketStatus.config.js
 * Path: src/modules/publicTicketStatus/publicTicketStatus.config.js
 * ============================================================================
 *
 * Description:
 * Static allowlist controlling which ticket fields are exposed through
 * the public ticket-status API.
 *
 * IMPORTANT:
 * This is NOT a dynamic form-field definition system.
 * It only controls the public API response projection.
 *
 * To expose another safe field later, add it here and map it in the
 * repository/service as required.
 * ============================================================================
 */

const PUBLIC_TICKET_STATUS_FIELDS = Object.freeze({
  ticketNumber: Object.freeze({
    select: "t.ticket_number",
    alias: "ticketNumber",
  }),

  createdDate: Object.freeze({
    select: "t.created_at",
    alias: "createdDate",
  }),

  statusCode: Object.freeze({
    select: "ts.code",
    alias: "statusCode",
  }),

  statusName: Object.freeze({
    select: "ts.name",
    alias: "statusName",
  }),

  lastUpdated: Object.freeze({
    select: "t.updated_at",
    alias: "lastUpdated",
  }),
});

export { PUBLIC_TICKET_STATUS_FIELDS };

export default Object.freeze({
  PUBLIC_TICKET_STATUS_FIELDS,
});