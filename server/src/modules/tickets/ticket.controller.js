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

async function assignTicket(req, res, next) {
    try {
        const ticket = await ticketService.assignTicket(
            req.params.ticketId,
            req.body.assignedEmployeeId,
        );

        return ApiResponse.updated(
            res,
            ticket,
            TICKET_MESSAGES.ASSIGN_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function resolveTicket(req, res, next) {
    try {
        const ticket = await ticketService.resolveTicket(
            req.params.ticketId,
            req.body.resolutionNote,
        );

        return ApiResponse.updated(
            res,
            ticket,
            TICKET_MESSAGES.RESOLVE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function closeTicket(req, res, next) {
    try {
        const ticket = await ticketService.closeTicket(
            req.params.ticketId,
        );

        return ApiResponse.updated(
            res,
            ticket,
            TICKET_MESSAGES.CLOSE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function reopenTicket(req, res, next) {
    try {
        const ticket = await ticketService.reopenTicket(
            req.params.ticketId,
        );

        return ApiResponse.updated(
            res,
            ticket,
            TICKET_MESSAGES.REOPEN_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteTicket(req, res, next) {
    try {
        const ticket = await ticketService.deleteTicket(
            req.params.ticketId,
        );

        return ApiResponse.deleted(
            res,
            ticket,
            TICKET_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}
async function getAssignableUsers(req, res, next) {
    try {
        const users =
            await ticketService.getAssignableUsers();

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
    assignTicket,
    resolveTicket,
    closeTicket,
    reopenTicket,
    deleteTicket,
    getAssignableUsers,
});
