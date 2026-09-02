import ApiResponse from "../../helpers/ApiResponse.js";

import ticketIssueCategoryService from "./ticketIssueCategory.service.js";

import {
    TICKET_ISSUE_CATEGORY_MESSAGES,
} from "./ticketIssueCategory.constant.js";

async function getTicketCategories(
    req,
    res,
    next,
) {
    try {
        const result =
            await ticketIssueCategoryService
                .listTicketCategories(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            TICKET_ISSUE_CATEGORY_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getTicketIssueCategory(
    req,
    res,
    next,
) {
    try {
        const ticketIssueCategory =
            await ticketIssueCategoryService
                .getTicketIssueCategory(
                    req.params.ticketIssueCategoryId,
                );

        return ApiResponse.success(
            res,
            ticketIssueCategory,
            TICKET_ISSUE_CATEGORY_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createTicketIssueCategory(
    req,
    res,
    next,
) {
    try {
        const ticketIssueCategory =
            await ticketIssueCategoryService
                .createTicketIssueCategory(
                    req.body,
                );

        return ApiResponse.created(
            res,
            ticketIssueCategory,
            TICKET_ISSUE_CATEGORY_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateTicketIssueCategory(
    req,
    res,
    next,
) {
    try {
        const ticketIssueCategory =
            await ticketIssueCategoryService
                .updateTicketIssueCategory(
                    req.params.ticketIssueCategoryId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            ticketIssueCategory,
            TICKET_ISSUE_CATEGORY_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteTicketIssueCategory(
    req,
    res,
    next,
) {
    try {
        const ticketIssueCategory =
            await ticketIssueCategoryService
                .deactivateTicketIssueCategory(
                    req.params.ticketIssueCategoryId,
                );

        return ApiResponse.deleted(
            res,
            ticketIssueCategory,
            TICKET_ISSUE_CATEGORY_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getTicketCategories,
    getTicketIssueCategory,
    createTicketIssueCategory,
    updateTicketIssueCategory,
    deleteTicketIssueCategory,
});