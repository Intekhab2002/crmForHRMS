import AppError from "../../helpers/AppError.js";

import ticketDependencyCategoryRepository from "./ticketDependencyCategory.repository.js";

import {
    TICKET_DEPENDENCY_CATEGORY_ERROR_CODES,
} from "./ticketDependencyCategory.constant.js";

async function getTicketDependencyCategory(ticketDependencyCategoryId) {
    const ticketDependencyCategory =
        await ticketDependencyCategoryRepository.findTicketDependencyCategoryById(
            ticketDependencyCategoryId,
        );

    if (!ticketDependencyCategory) {
        throw AppError.notFound(
            "Ticket Dependency Category not found.",
            {
                code:
                    TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return ticketDependencyCategory;
}

async function listTicketDependencyCategories(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await ticketDependencyCategoryRepository.findTicketDependencyCategories({
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

async function createTicketDependencyCategory(data) {
    const existingByCode =
        await ticketDependencyCategoryRepository
            .findTicketDependencyCategoryByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A ticket dependency category with this code already exists.",
            {
                code:
                    TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await ticketDependencyCategoryRepository
            .findTicketDependencyCategoryByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A ticket dependency category with this name already exists.",
            {
                code:
                    TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await ticketDependencyCategoryRepository
            .createTicketDependencyCategory(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket dependency category with the supplied code or name already exists.",
                {
                    code:
                        TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateTicketDependencyCategory(
    ticketDependencyCategoryId,
    data,
) {

    if (data.code) {
        const duplicate =
            await ticketDependencyCategoryRepository
                .findTicketDependencyCategoryByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== ticketDependencyCategoryId
        ) {
            throw AppError.conflict(
                "A ticket dependency category with this code already exists.",
                {
                    code:
                        TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await ticketDependencyCategoryRepository
                .findTicketDependencyCategoryByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== ticketDependencyCategoryId
        ) {
            throw AppError.conflict(
                "A ticket dependency category with this name already exists.",
                {
                    code:
                        TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await ticketDependencyCategoryRepository
            .updateTicketDependencyCategory(
                ticketDependencyCategoryId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket dependency category with the supplied code or name already exists.",
                {
                    code:
                        TICKET_DEPENDENCY_CATEGORY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateTicketDependencyCategory(
    ticketDependencyCategoryId,
) {
    const existing =
        await getTicketDependencyCategory(
            ticketDependencyCategoryId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return ticketDependencyCategoryRepository
        .deactivateTicketDependencyCategory(
            ticketDependencyCategoryId,
        );
}

export default Object.freeze({
    listTicketDependencyCategories,
    getTicketDependencyCategory,
    createTicketDependencyCategory,
    updateTicketDependencyCategory,
    deactivateTicketDependencyCategory,
});