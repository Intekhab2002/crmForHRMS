import AppError from "../../helpers/AppError.js";

import ticketIssueCategoryRepository from "./ticketIssueCategory.repository.js";

import {
    TICKET_ISSUE_CATEGORY_ERROR_CODES,
} from "./ticketIssueCategory.constant.js";

async function getTicketIssueCategory(ticketIssueCategoryId) {
    const ticketIssueCategory =
        await ticketIssueCategoryRepository.findTicketIssueCategoryById(
            ticketIssueCategoryId,
        );

    if (!ticketIssueCategory) {
        throw AppError.notFound(
            "Ticket issue category not found.",
            {
                code:
                    TICKET_ISSUE_CATEGORY_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return ticketIssueCategory;
}

async function listTicketCategories(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await ticketIssueCategoryRepository.findTicketCategories({
            search: query.search,
            isActive: query.isActive,
            limit,
            offset: (page - 1) * limit,
        });

    const totalPages =
        result.total === 0
            ? 0
            : Math.ceil(
                result.total / limit,
            );

    return {
        data: result.rows,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages,
            hasNextPage:
                page < totalPages,
            hasPreviousPage:
                page > 1 &&
                totalPages > 0,
        },
    };
}

async function createTicketIssueCategory(data) {
    const existingByCode =
        await ticketIssueCategoryRepository
            .findTicketIssueCategoryByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A ticket issue category with this code already exists.",
            {
                code:
                    TICKET_ISSUE_CATEGORY_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await ticketIssueCategoryRepository
            .findTicketIssueCategoryByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A ticket issue category with this name already exists.",
            {
                code:
                    TICKET_ISSUE_CATEGORY_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await ticketIssueCategoryRepository
            .createTicketIssueCategory(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket issue category with the supplied code or name already exists.",
                {
                    code:
                        TICKET_ISSUE_CATEGORY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateTicketIssueCategory(
    ticketIssueCategoryId,
    data,
) {

    if (data.code) {
        const duplicate =
            await ticketIssueCategoryRepository
                .findTicketIssueCategoryByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== ticketIssueCategoryId
        ) {
            throw AppError.conflict(
                "A ticket issue category with this code already exists.",
                {
                    code:
                        TICKET_ISSUE_CATEGORY_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await ticketIssueCategoryRepository
                .findTicketIssueCategoryByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== ticketIssueCategoryId
        ) {
            throw AppError.conflict(
                "A ticket issue category with this name already exists.",
                {
                    code:
                        TICKET_ISSUE_CATEGORY_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await ticketIssueCategoryRepository
            .updateTicketIssueCategory(
                ticketIssueCategoryId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket issue category with the supplied code or name already exists.",
                {
                    code:
                        TICKET_ISSUE_CATEGORY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateTicketIssueCategory(
    ticketIssueCategoryId,
) {
    const existing =
        await getTicketIssueCategory(
            ticketIssueCategoryId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return ticketIssueCategoryRepository
        .deactivateTicketIssueCategory(
            ticketIssueCategoryId,
        );
}

export default Object.freeze({
    listTicketCategories,
    getTicketIssueCategory,
    createTicketIssueCategory,
    updateTicketIssueCategory,
    deactivateTicketIssueCategory,
});