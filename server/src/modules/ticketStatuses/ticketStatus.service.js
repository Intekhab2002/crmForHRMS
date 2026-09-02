import AppError from "../../helpers/AppError.js";

import ticketStatusRepository from "./ticketStatus.repository.js";

import {
    TICKET_STATUS_ERROR_CODES,
} from "./ticketStatus.constant.js";

async function getTicketStatus(ticketStatusId) {
    const ticketStatus =
        await ticketStatusRepository.findTicketStatusById(
            ticketStatusId,
        );

    if (!ticketStatus) {
        throw AppError.notFound(
            "Ticket status not found.",
            {
                code:
                    TICKET_STATUS_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return ticketStatus;
}

async function listticketStatus(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await ticketStatusRepository.findticketStatus({
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

async function createTicketStatus(data) {
    const existingByCode =
        await ticketStatusRepository
            .findTicketStatusByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A ticket status with this code already exists.",
            {
                code:
                    TICKET_STATUS_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await ticketStatusRepository
            .findTicketStatusByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A ticket status with this name already exists.",
            {
                code:
                    TICKET_STATUS_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await ticketStatusRepository
            .createTicketStatus(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket status with the supplied code or name already exists.",
                {
                    code:
                        TICKET_STATUS_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateTicketStatus(
    ticketStatusId,
    data,
) {

    if (data.code) {
        const duplicate =
            await ticketStatusRepository
                .findTicketStatusByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== ticketStatusId
        ) {
            throw AppError.conflict(
                "A ticket status with this code already exists.",
                {
                    code:
                        TICKET_STATUS_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await ticketStatusRepository
                .findTicketStatusByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== ticketStatusId
        ) {
            throw AppError.conflict(
                "A ticket status with this name already exists.",
                {
                    code:
                        TICKET_STATUS_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await ticketStatusRepository
            .updateTicketStatus(
                ticketStatusId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A ticket status with the supplied code or name already exists.",
                {
                    code:
                        TICKET_STATUS_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateTicketStatus(
    ticketStatusId,
) {
    const existing =
        await getTicketStatus(
            ticketStatusId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return ticketStatusRepository
        .deactivateTicketStatus(
            ticketStatusId,
        );
}

export default Object.freeze({
    listticketStatus,
    getTicketStatus,
    createTicketStatus,
    updateTicketStatus,
    deactivateTicketStatus,
});