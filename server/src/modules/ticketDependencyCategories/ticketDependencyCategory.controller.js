import ApiResponse from "../../helpers/ApiResponse.js";

import ticketDependencyCategoryService from "./ticketDependencyCategory.service.js";

import {
    TICKET_DEPENDENCY_CATEGORY_MESSAGES,
} from "./ticketDependencyCategory.constant.js";

async function getTicketDependencyCategories(
    req,
    res,
    next,
) {
    try {
        const result =
            await ticketDependencyCategoryService
                .listTicketDependencyCategories(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            TICKET_DEPENDENCY_CATEGORY_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getTicketDependencyCategory(
    req,
    res,
    next,
) {
    try {
        const ticketDependencyCategory =
            await ticketDependencyCategoryService
                .getTicketDependencyCategory(
                    req.params.ticketDependencyCategoryId,
                );

        return ApiResponse.success(
            res,
            ticketDependencyCategory,
            TICKET_DEPENDENCY_CATEGORY_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createTicketDependencyCategory(
    req,
    res,
    next,
) {
    try {
        const ticketDependencyCategory =
            await ticketDependencyCategoryService
                .createTicketDependencyCategory(
                    req.body,
                );

        return ApiResponse.created(
            res,
            ticketDependencyCategory,
            TICKET_DEPENDENCY_CATEGORY_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateTicketDependencyCategory(
    req,
    res,
    next,
) {
    try {
        const ticketDependencyCategory =
            await ticketDependencyCategoryService
                .updateTicketDependencyCategory(
                    req.params.ticketDependencyCategoryId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            ticketDependencyCategory,
            TICKET_DEPENDENCY_CATEGORY_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteTicketDependencyCategory(
    req,
    res,
    next,
) {
    try {
        const ticketDependencyCategory =
            await ticketDependencyCategoryService
                .deactivateTicketDependencyCategory(
                    req.params.ticketDependencyCategoryId,
                );

        return ApiResponse.deleted(
            res,
            ticketDependencyCategory,
            TICKET_DEPENDENCY_CATEGORY_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getTicketDependencyCategories,
    getTicketDependencyCategory,
    createTicketDependencyCategory,
    updateTicketDependencyCategory,
    deleteTicketDependencyCategory,
});