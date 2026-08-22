import { ApiResponse } from "../../helpers/ApiResponse.js";

import ticketCommentService
    from "./ticketComment.service.js";

import {
    TICKET_COMMENT_MESSAGES,
} from "./ticketComment.constants.js";

import {
    mapTicketComment,
    mapTicketComments,
} from "./ticketComment.mapper.js";

async function getComments(req, res, next) {
    try {
        const comments =
            await ticketCommentService.listComments(
                req.params.ticketId,
            );

        return ApiResponse.success(
            res,
            mapTicketComments(comments),
            TICKET_COMMENT_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createComment(req, res, next) {
    try {
        const comment =
            await ticketCommentService.createComment(
                req.params.ticketId,
                req.auth.userId,
                req.body.comment,
            );

        return ApiResponse.created(
            res,
            mapTicketComment(comment),
            TICKET_COMMENT_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getComments,
    createComment,
});