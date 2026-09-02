import ApiResponse from "../../helpers/ApiResponse.js";

import ticketSeverityService from "./ticketSeverity.service.js";

import {
    TICKET_SEVERITY_MESSAGES,
} from "./ticketSeverity.constant.js";

async function getTicketSeverities(
    req,
    res,
    next,
) {
    try {
        const result =
            await ticketSeverityService
                .listTicketSeverities(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            TICKET_SEVERITY_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getTicketSeverity(
    req,
    res,
    next,
) {
    try {
        const ticketSeverity =
            await ticketSeverityService
                .getTicketSeverity(
                    req.params.ticketSeverityId,
                );

        return ApiResponse.success(
            res,
            ticketSeverity,
            TICKET_SEVERITY_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createTicketSeverity(
    req,
    res,
    next,
) {
    try {
        const ticketSeverity =
            await ticketSeverityService
                .createTicketSeverity(
                    req.body,
                );

        return ApiResponse.created(
            res,
            ticketSeverity,
            TICKET_SEVERITY_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateTicketSeverity(
    req,
    res,
    next,
) {
    try {
        const ticketSeverity =
            await ticketSeverityService
                .updateTicketSeverity(
                    req.params.ticketSeverityId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            ticketSeverity,
            TICKET_SEVERITY_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteTicketSeverity(
    req,
    res,
    next,
) {
    try {
        const ticketSeverity =
            await ticketSeverityService
                .deactivateTicketSeverity(
                    req.params.ticketSeverityId,
                );

        return ApiResponse.deleted(
            res,
            ticketSeverity,
            TICKET_SEVERITY_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getTicketSeverities,
    getTicketSeverity,
    createTicketSeverity,
    updateTicketSeverity,
    deleteTicketSeverity,
});