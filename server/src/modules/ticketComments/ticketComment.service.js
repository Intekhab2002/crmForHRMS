import AppError from "../../helpers/AppError.js";

import ticketRepository from "../tickets/ticket.repository.js";
import userRepository from "../users/user.repository.js";

import ticketCommentRepository from "./ticketComment.repository.js";

import { TICKET_COMMENT_ERROR_CODES } from "./ticketComment.constants.js";

import ticketLifecycleService from "../tickets/ticketLifecycle.service.js";

import {
  TICKET_LIFECYCLE_EVENT_TYPE,
  TICKET_LIFECYCLE_EVENT_ACTION,
} from "../tickets/ticketLifecycle.constants.js";

async function validateTicket(ticketId) {
  const ticket = await ticketRepository.findTicketById(ticketId);

  if (!ticket) {
    throw AppError.notFound("Ticket not found.", {
      code: TICKET_COMMENT_ERROR_CODES.TICKET_NOT_FOUND,
    });
  }

  return ticket;
}

async function validateUser(userId) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw AppError.notFound("User not found.", {
      code: TICKET_COMMENT_ERROR_CODES.USER_NOT_FOUND,
    });
  }

  return user;
}

async function listComments(ticketId) {
  await validateTicket(ticketId);

  return ticketCommentRepository.listComments(ticketId);
}

async function createComment(ticketId, userId, comment) {
  await validateTicket(ticketId);
  await validateUser(userId);

  const createdComment = await ticketCommentRepository.createComment(
    ticketId,
    userId,
    comment,
  );

  await ticketLifecycleService.record({
    ticketId,
    actorUserId: userId,

    eventType: TICKET_LIFECYCLE_EVENT_TYPE.COMMENT,

    eventAction: TICKET_LIFECYCLE_EVENT_ACTION.COMMENT_ADDED,

    metadata: {
      commentId: createdComment.id,
      comment: createdComment.comment,
    },
  });

  return createdComment;
}

export default Object.freeze({
  listComments,
  createComment,
});
