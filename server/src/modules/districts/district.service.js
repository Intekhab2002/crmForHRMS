import AppError from "../../helpers/AppError.js";

import districtRepository from "./district.repository.js";

import {
    DISTRICT_ERROR_CODES,
} from "./district.constant.js";

async function getDistrict(districtId) {
    const district =
        await districtRepository.findDistrictById(
            districtId,
        );

    if (!district) {
        throw AppError.notFound(
            "District not found.",
            {
                code:
                    DISTRICT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return district;
}

async function listDistricts(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await districtRepository.findDistricts({
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

async function createDistrict(data) {
    const existingByCode =
        await districtRepository
            .findDistrictByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A district with this code already exists.",
            {
                code:
                    DISTRICT_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await districtRepository
            .findDistrictByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A district with this name already exists.",
            {
                code:
                    DISTRICT_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await districtRepository
            .createDistrict(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A district with the supplied code or name already exists.",
                {
                    code:
                        DISTRICT_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateDistrict(
    districtId,
    data,
) {
   if (data.code) {
        const duplicate =
            await districtRepository
                .findDistrictByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== districtId
        ) {
            throw AppError.conflict(
                "A district with this code already exists.",
                {
                    code:
                        DISTRICT_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await districtRepository
                .findDistrictByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== districtId
        ) {
            throw AppError.conflict(
                "A district with this name already exists.",
                {
                    code:
                        DISTRICT_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await districtRepository
            .updateDistrict(
                districtId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A district with the supplied code or name already exists.",
                {
                    code:
                        DISTRICT_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateDistrict(
    districtId,
) {
    const existing =
        await getDistrict(
            districtId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return districtRepository
        .deactivateDistrict(
            districtId,
        );
}

export default Object.freeze({
    listDistricts,
    getDistrict,
    createDistrict,
    updateDistrict,
    deactivateDistrict,
});