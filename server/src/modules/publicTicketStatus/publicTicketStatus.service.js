/**
 * ============================================================================
 * File: publicTicketStatus.service.js
 * Path: src/modules/publicTicketStatus/publicTicketStatus.service.js
 * ============================================================================
 */

import publicTicketStatusRepository from "./publicTicketStatus.repository.js";

async function searchPublicTicketStatuses(payload) {
  const normalizedPayload = {
    createdDate: payload.createdDate,
    ticketNumber:
      payload.ticketNumber?.trim() || null,
    mobileNumber:
      payload.mobileNumber?.trim() || null,
    emailId:
      payload.emailId?.trim() || null,
  };

  const tickets =
    await publicTicketStatusRepository.findPublicTicketStatuses(
      normalizedPayload,
    );

  return tickets;
}

export default Object.freeze({
  searchPublicTicketStatuses,
});