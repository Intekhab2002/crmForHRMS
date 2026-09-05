/**
 * ============================================================================
 * File: publicTicketStatus.controller.js
 * Path: src/modules/publicTicketStatus/publicTicketStatus.controller.js
 * ============================================================================
 */

import { ApiResponse } from "../../helpers/ApiResponse.js";

import publicTicketStatusService from "./publicTicketStatus.service.js";

import {
  PUBLIC_TICKET_STATUS_MESSAGES,
} from "./publicTicketStatus.constants.js";

async function searchPublicTicketStatuses(req, res, next) {
  try {
    const tickets =
      await publicTicketStatusService.searchPublicTicketStatuses(
        req.validatedBody ?? req.body,
      );

    return ApiResponse.success(
      res,
      tickets,
      PUBLIC_TICKET_STATUS_MESSAGES.SEARCH_SUCCESS,
    );
  } catch (error) {
    return next(error);
  }
}

export default Object.freeze({
  searchPublicTicketStatuses,
});