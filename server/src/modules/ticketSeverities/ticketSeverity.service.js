import AppError from "../../helpers/AppError.js";

import ticketSeverityRepository from "./ticketSeverity.repository.js";

import {
    TICKET_SEVERITY_ERROR_CODES,
} from "./ticketSeverity.constant.js";

async function getTicketSeverity(ticketSeverityId) {
    const ticketSeverity =
        await ticketSeverityRepository.findTicketSeverityById(
            ticketSeverityId,
        );

    if (!ticketSeverity) {
        throw AppError.notFound(
            "Ticket severity not found.",
            {
                code:
                    TICKET_SEVERITY_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return ticketSeverity;
}

async function listTicketSeverities(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await ticketSeverityRepository.findTicketSeverities({
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

async function createTicketSeverity(data) {
    const existingByCode =
        await ticketSeverityRepository
            .findTicketSeverityByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A ticket severity with this code already exists.",
            {
                code:
                    TICKET_SEVERITY_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await ticketSeverityRepository
            .findTicketSeverityByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A ticket severity with this name already exists.",
            {
                code:
                    TICKET_SEVERITY_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await ticketSeverityRepository
            .createTicketSeverity(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket severity with the supplied code or name already exists.",
                {
                    code:
                        TICKET_SEVERITY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateTicketSeverity(
    ticketSeverityId,
    data,
) {

    if (data.code) {
        const duplicate =
            await ticketSeverityRepository
                .findTicketSeverityByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== ticketSeverityId
        ) {
            throw AppError.conflict(
                "A ticket severity with this code already exists.",
                {
                    code:
                        TICKET_SEVERITY_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await ticketSeverityRepository
                .findTicketSeverityByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== ticketSeverityId
        ) {
            throw AppError.conflict(
                "A ticket severity with this name already exists.",
                {
                    code:
                        TICKET_SEVERITY_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await ticketSeverityRepository
            .updateTicketSeverity(
                ticketSeverityId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket severity with the supplied code or name already exists.",
                {
                    code:
                        TICKET_SEVERITY_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateTicketSeverity(
    ticketSeverityId,
) {
    const existing =
        await getTicketSeverity(
            ticketSeverityId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return ticketSeverityRepository
        .deactivateTicketSeverity(
            ticketSeverityId,
        );
}

export default Object.freeze({
    listTicketSeverities,
    getTicketSeverity,
    createTicketSeverity,
    updateTicketSeverity,
    deactivateTicketSeverity,
});