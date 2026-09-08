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

async function updateComment(
    ticketId,
    commentId,
    userId,
    comment,
) {
    await validateTicket(ticketId);
    await validateUser(userId);

    const existingComment =
        await ticketCommentRepository.findCommentById(
            commentId,
            ticketId,
        );

    if (!existingComment) {
        throw AppError.notFound(
            "Ticket comment not found.",
            {
                code:
                    TICKET_COMMENT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    if (existingComment.user_id !== userId) {
        throw AppError.forbidden(
            "You can only edit your own comments.",
            {
                code:
                    TICKET_COMMENT_ERROR_CODES.EDIT_NOT_ALLOWED,
            },
        );
    }

    const trimmedComment = comment.trim();

    if (trimmedComment === existingComment.comment) {
        return existingComment;
    }

    const updatedComment =
        await ticketCommentRepository.updateComment(
            commentId,
            ticketId,
            trimmedComment,
        );

    if (!updatedComment) {
        throw AppError.notFound(
            "Ticket comment not found.",
            {
                code:
                    TICKET_COMMENT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    await ticketLifecycleService.record({
        ticketId,
        actorUserId: userId,

        eventType:
            TICKET_LIFECYCLE_EVENT_TYPE.COMMENT,

        eventAction:
            TICKET_LIFECYCLE_EVENT_ACTION.COMMENT_UPDATED,

        metadata: {
            commentId: updatedComment.id,
            previousComment: existingComment.comment,
            comment: updatedComment.comment,
        },
    });

    return updatedComment;
}

export default Object.freeze({
  listComments,
  createComment,
  updateComment,
});
