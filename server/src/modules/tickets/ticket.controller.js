import { ApiResponse } from "../../helpers/ApiResponse.js";

import ticketService from "./ticket.service.js";
import { TICKET_MESSAGES } from "./ticket.constants.js";

async function getTickets(req, res, next) {
    try {
        const result = await ticketService.listTickets(
            req.validatedQuery ?? req.query,
        );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            TICKET_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getTicket(req, res, next) {
    try {
        const ticket = await ticketService.getTicket(
            req.params.ticketId,
        );

        return ApiResponse.success(
            res,
            ticket,
            TICKET_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createTicket(req, res, next) {
    try {
        const ticket = await ticketService.createTicket(
            req.body,
            req.auth.userId,
        );

        return ApiResponse.created(
            res,
            ticket,
            TICKET_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateTicket(req, res, next) {
    try {
        const ticket = await ticketService.updateTicket(
            req.params.ticketId,
            req.body,
        );

        return ApiResponse.updated(
            res,
            ticket,
            TICKET_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getAssignableUsers(req, res, next) {
    try {
        const users = await ticketService.getAssignableUsers();

        return ApiResponse.success(
            res,
            users,
            TICKET_MESSAGES.ASSIGNABLE_USERS_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    getAssignableUsers,
});
