import AppError from "../../helpers/AppError.js";

import serviceTypeRepository from "./serviceType.repository.js";

import {
    SERVICE_TYPE_ERROR_CODES,
} from "./serviceType.constant.js";

async function getServiceType(serviceTypeId) {
    const serviceType =
        await serviceTypeRepository.findServiceTypeById(
            serviceTypeId,
        );

    if (!serviceType) {
        throw AppError.notFound(
            "Service type not found.",
            {
                code:
                    SERVICE_TYPE_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return serviceType;
}

async function listServiceTypes(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await serviceTypeRepository.findServiceTypes({
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

async function createServiceType(data) {
    const existingByCode =
        await serviceTypeRepository
            .findServiceTypeByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A service type with this code already exists.",
            {
                code:
                    SERVICE_TYPE_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await serviceTypeRepository
            .findServiceTypeByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A service type with this name already exists.",
            {
                code:
                    SERVICE_TYPE_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await serviceTypeRepository
            .createServiceType(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A service type with the supplied code or name already exists.",
                {
                    code:
                        SERVICE_TYPE_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateServiceType(
    serviceTypeId,
    data,
) {
    const existing =
        await getServiceType(
            serviceTypeId,
        );

    if (data.code) {
        const duplicate =
            await serviceTypeRepository
                .findServiceTypeByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== serviceTypeId
        ) {
            throw AppError.conflict(
                "A service type with this code already exists.",
                {
                    code:
                        SERVICE_TYPE_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await serviceTypeRepository
                .findServiceTypeByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== serviceTypeId
        ) {
            throw AppError.conflict(
                "A service type with this name already exists.",
                {
                    code:
                        SERVICE_TYPE_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await serviceTypeRepository
            .updateServiceType(
                serviceTypeId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A service type with the supplied code or name already exists.",
                {
                    code:
                        SERVICE_TYPE_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateServiceType(
    serviceTypeId,
) {
    const existing =
        await getServiceType(
            serviceTypeId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return serviceTypeRepository
        .deactivateServiceType(
            serviceTypeId,
        );
}

export default Object.freeze({
    listServiceTypes,
    getServiceType,
    createServiceType,
    updateServiceType,
    deactivateServiceType,
});