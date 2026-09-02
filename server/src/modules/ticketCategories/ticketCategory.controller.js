import ApiResponse from "../../helpers/ApiResponse.js";

import ticketCategoryService from "./ticketCategory.service.js";

import {
    TICKET_CATEGORY_MESSAGES,
} from "./ticketCategory.constant.js";

async function getTicketCategories(
    req,
    res,
    next,
) {
    try {
        const result =
            await ticketCategoryService
                .listTicketCategories(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            TICKET_CATEGORY_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getTicketCategory(
    req,
    res,
    next,
) {
    try {
        const ticketCategory =
            await ticketCategoryService
                .getTicketCategory(
                    req.params.ticketCategoryId,
                );

        return ApiResponse.success(
            res,
            ticketCategory,
            TICKET_CATEGORY_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createTicketCategory(
    req,
    res,
    next,
) {
    try {
        const ticketCategory =
            await ticketCategoryService
                .createTicketCategory(
                    req.body,
                );

        return ApiResponse.created(
            res,
            ticketCategory,
            TICKET_CATEGORY_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateTicketCategory(
    req,
    res,
    next,
) {
    try {
        const ticketCategory =
            await ticketCategoryService
                .updateTicketCategory(
                    req.params.ticketCategoryId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            ticketCategory,
            TICKET_CATEGORY_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteTicketCategory(
    req,
    res,
    next,
) {
    try {
        const ticketCategory =
            await ticketCategoryService
                .deactivateTicketCategory(
                    req.params.ticketCategoryId,
                );

        return ApiResponse.deleted(
            res,
            ticketCategory,
            TICKET_CATEGORY_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getTicketCategories,
    getTicketCategory,
    createTicketCategory,
    updateTicketCategory,
    deleteTicketCategory,
});