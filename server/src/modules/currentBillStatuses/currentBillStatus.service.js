import AppError from "../../helpers/AppError.js";

import currentBillStatusRepository from "./currentBillStatus.repository.js";

import {
    CURRENT_BILL_STATUS_ERROR_CODES,
} from "./currentBillStatus.constant.js";

async function getCurrentBillStatus(currentBillStatusId) {
    const currentBillStatus =
        await currentBillStatusRepository.findCurrentBillStatusById(
            currentBillStatusId,
        );

    if (!currentBillStatus) {
        throw AppError.notFound(
            "Current bill status not found.",
            {
                code:
                    CURRENT_BILL_STATUS_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return currentBillStatus;
}

async function listcurrentBillStatus(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await currentBillStatusRepository.findcurrentBillStatus({
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

async function createCurrentBillStatus(data) {
    const existingByCode =
        await currentBillStatusRepository
            .findCurrentBillStatusByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A current bill status with this code already exists.",
            {
                code:
                    CURRENT_BILL_STATUS_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await currentBillStatusRepository
            .findCurrentBillStatusByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A current bill status with this name already exists.",
            {
                code:
                    CURRENT_BILL_STATUS_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await currentBillStatusRepository
            .createCurrentBillStatus(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A current bill status with the supplied code or name already exists.",
                {
                    code:
                        CURRENT_BILL_STATUS_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateCurrentBillStatus(
    currentBillStatusId,
    data,
) {

    if (data.code) {
        const duplicate =
            await currentBillStatusRepository
                .findCurrentBillStatusByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== currentBillStatusId
        ) {
            throw AppError.conflict(
                "A current bill status with this code already exists.",
                {
                    code:
                        CURRENT_BILL_STATUS_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await currentBillStatusRepository
                .findCurrentBillStatusByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== currentBillStatusId
        ) {
            throw AppError.conflict(
                "A current bill status with this name already exists.",
                {
                    code:
                        CURRENT_BILL_STATUS_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await currentBillStatusRepository
            .updateCurrentBillStatus(
                currentBillStatusId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A current bill status with the supplied code or name already exists.",
                {
                    code:
                        CURRENT_BILL_STATUS_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateCurrentBillStatus(
    currentBillStatusId,
) {
    const existing =
        await getCurrentBillStatus(
            currentBillStatusId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return currentBillStatusRepository
        .deactivateCurrentBillStatus(
            currentBillStatusId,
        );
}

export default Object.freeze({
    listcurrentBillStatus,
    getCurrentBillStatus,
    createCurrentBillStatus,
    updateCurrentBillStatus,
    deactivateCurrentBillStatus,
});