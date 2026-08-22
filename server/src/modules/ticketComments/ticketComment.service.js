import AppError from "../../helpers/AppError.js";

import ticketRepository from "../tickets/ticket.repository.js";
import userRepository from "../users/user.repository.js";

import ticketCommentRepository
    from "./ticketComment.repository.js";

import {
    TICKET_COMMENT_ERROR_CODES,
} from "./ticketComment.constants.js";

async function validateTicket(ticketId) {
    const ticket = await ticketRepository.findById(ticketId);

    if (!ticket) {
        throw AppError.notFound(
            "Ticket not found.",
            {
                code:
                    TICKET_COMMENT_ERROR_CODES.TICKET_NOT_FOUND,
            },
        );
    }

    return ticket;
}

async function validateUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw AppError.notFound(
            "User not found.",
            {
                code:
                    TICKET_COMMENT_ERROR_CODES.USER_NOT_FOUND,
            },
        );
    }

    return user;
}

async function listComments(ticketId) {
    await validateTicket(ticketId);

    return ticketCommentRepository.listComments(
        ticketId,
    );
}

async function createComment(
    ticketId,
    userId,
    comment,
) {
    await validateTicket(ticketId);
    await validateUser(userId);

    const createdComment =
        await ticketCommentRepository.createComment(
            ticketId,
            userId,
            comment,
        );

    return createdComment;
}

export default Object.freeze({
    listComments,
    createComment,
});