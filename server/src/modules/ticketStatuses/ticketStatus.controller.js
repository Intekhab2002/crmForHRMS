import ApiResponse from "../../helpers/ApiResponse.js";

import ticketStatusService from "./ticketStatus.service.js";

import {
    TICKET_STATUS_MESSAGES,
} from "./ticketStatus.constant.js";

async function getTicketStatuses(
    req,
    res,
    next,
) {
    try {
        const result =
            await ticketStatusService
                .listticketStatus(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            TICKET_STATUS_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getTicketStatus(
    req,
    res,
    next,
) {
    try {
        const ticketStatus =
            await ticketStatusService
                .getTicketStatus(
                    req.params.ticketStatusId,
                );

        return ApiResponse.success(
            res,
            ticketStatus,
            TICKET_STATUS_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createTicketStatus(
    req,
    res,
    next,
) {
    try {
        const ticketStatus =
            await ticketStatusService
                .createTicketStatus(
                    req.body,
                );

        return ApiResponse.created(
            res,
            ticketStatus,
            TICKET_STATUS_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateTicketStatus(
    req,
    res,
    next,
) {
    try {
        const ticketStatus =
            await ticketStatusService
                .updateTicketStatus(
                    req.params.ticketStatusId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            ticketStatus,
            TICKET_STATUS_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteTicketStatus(
    req,
    res,
    next,
) {
    try {
        const ticketStatus =
            await ticketStatusService
                .deactivateTicketStatus(
                    req.params.ticketStatusId,
                );

        return ApiResponse.deleted(
            res,
            ticketStatus,
            TICKET_STATUS_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getTicketStatuses,
    getTicketStatus,
    createTicketStatus,
    updateTicketStatus,
    deleteTicketStatus,
});