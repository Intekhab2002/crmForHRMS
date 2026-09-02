import AppError from "../../helpers/AppError.js";

import ticketCategoryRepository from "./ticketCategory.repository.js";

import {
    TICKET_CATEGORY_ERROR_CODES,
} from "./ticketCategory.constant.js";

async function getTicketCategory(ticketCategoryId) {
    const ticketCategory =
        await ticketCategoryRepository.findTicketCategoryById(
            ticketCategoryId,
        );

    if (!ticketCategory) {
        throw AppError.notFound(
            "Ticket category not found.",
            {
                code:
                    TICKET_CATEGORY_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return ticketCategory;
}

async function listTicketCategorys(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await ticketCategoryRepository.findTicketCategorys({
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

async function createTicketCategory(data) {
    const existingByCode =
        await ticketCategoryRepository
            .findTicketCategoryByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A ticket category with this code already exists.",
            {
                code:
                    TICKET_CATEGORY_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await ticketCategoryRepository
            .findTicketCategoryByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A ticket category with this name already exists.",
            {
                code:
                    TICKET_CATEGORY_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await ticketCategoryRepository
            .createTicketCategory(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket category with the supplied code or name already exists.",
                {
                    code:
                        TICKET_CATEGORY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateTicketCategory(
    ticketCategoryId,
    data,
) {
    const existing =
        await getTicketCategory(
            ticketCategoryId,
        );

    if (data.code) {
        const duplicate =
            await ticketCategoryRepository
                .findTicketCategoryByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== ticketCategoryId
        ) {
            throw AppError.conflict(
                "A ticket category with this code already exists.",
                {
                    code:
                        TICKET_CATEGORY_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await ticketCategoryRepository
                .findTicketCategoryByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== ticketCategoryId
        ) {
            throw AppError.conflict(
                "A ticket category with this name already exists.",
                {
                    code:
                        TICKET_CATEGORY_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await ticketCategoryRepository
            .updateTicketCategory(
                ticketCategoryId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket category with the supplied code or name already exists.",
                {
                    code:
                        TICKET_CATEGORY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateTicketCategory(
    ticketCategoryId,
) {
    const existing =
        await getTicketCategory(
            ticketCategoryId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return ticketCategoryRepository
        .deactivateTicketCategory(
            ticketCategoryId,
        );
}

export default Object.freeze({
    listTicketCategorys,
    getTicketCategory,
    createTicketCategory,
    updateTicketCategory,
    deactivateTicketCategory,
});