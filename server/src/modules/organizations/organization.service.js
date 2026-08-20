import AppError from "../../helpers/AppError.js";
import organizationRepository from "./organization.repository.js";
import {
    ORGANIZATION_ERROR_CODES,
} from "./organization.constant.js";

async function getOrganization(organizationId) {
    const organization =
        await organizationRepository.findOrganizationById(
            organizationId,
        );

    if (!organization) {
        throw AppError.notFound(
            "Organization not found.",
            {
                code: ORGANIZATION_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return organization;
}

async function listOrganizations(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await organizationRepository.findOrganizations({
            search: query.search,
            status: query.status,
            limit,
            offset: (page - 1) * limit,
        });

    const totalPages =
        result.total === 0
            ? 0
            : Math.ceil(result.total / limit);

    return {
        data: result.rows,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage:
                page > 1 && totalPages > 0,
        },
    };
}

async function createOrganization(data) {
    if (
        await organizationRepository.findOrganizationByCode(
            data.code,
        )
    ) {
        throw AppError.conflict(
            "An organization with this code already exists.",
            {
                code: ORGANIZATION_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    if (
        await organizationRepository.findOrganizationByName(
            data.name,
        )
    ) {
        throw AppError.conflict(
            "An organization with this name already exists.",
            {
                code: ORGANIZATION_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await organizationRepository.createOrganization(
            data,
        );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "An organization with the supplied code or name already exists.",
                {
                    code: "ORGANIZATION_ALREADY_EXISTS",
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateOrganization(
    organizationId,
    data,
) {
    await getOrganization(organizationId);

    if (data.name) {
        const existing =
            await organizationRepository.findOrganizationByName(
                data.name,
            );

        if (
            existing &&
            existing.id !== organizationId
        ) {
            throw AppError.conflict(
                "An organization with this name already exists.",
                {
                    code: ORGANIZATION_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await organizationRepository.updateOrganization(
            organizationId,
            data,
        );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "An organization with the supplied name already exists.",
                {
                    code: "ORGANIZATION_ALREADY_EXISTS",
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateOrganization(
    organizationId,
) {
    const organization =
        await getOrganization(organizationId);

    const departmentCount =
        await organizationRepository.countDepartments(
            organizationId,
        );

    if (departmentCount > 0) {
        throw AppError.conflict(
            "Organization cannot be deactivated while departments are associated with it.",
            {
                code: ORGANIZATION_ERROR_CODES.HAS_DEPARTMENTS,
            },
        );
    }

    if (organization.status === "inactive") {
        return organization;
    }

    return organizationRepository.deactivateOrganization(
        organizationId,
    );
}

export default Object.freeze({
    listOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deactivateOrganization,
});
