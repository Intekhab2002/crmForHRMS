import AppError from "../../helpers/AppError.js";
import departmentRepository from "./department.repository.js";
import {
    DEPARTMENT_ERROR_CODES,
} from "./department.constant.js";

async function getDepartment(departmentId) {
    const department =
        await departmentRepository.findDepartmentById(
            departmentId,
        );

    if (!department) {
        throw AppError.notFound(
            "Department not found.",
            {
                code: DEPARTMENT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return department;
}

async function validateOrganization(organizationId) {
    const organization =
        await departmentRepository.findOrganization(
            organizationId,
        );

    if (!organization) {
        throw AppError.notFound(
            "Organization not found.",
            {
                code: DEPARTMENT_ERROR_CODES.ORGANIZATION_NOT_FOUND,
            },
        );
    }

    if (organization.status !== "active") {
        throw AppError.conflict(
            "Departments cannot be created under an inactive organization.",
            {
                code: "ORGANIZATION_INACTIVE",
            },
        );
    }

    return organization;
}

async function validateParent(
    parentDepartmentId,
    organizationId,
    currentDepartmentId = null,
) {
    if (!parentDepartmentId) return;

    if (parentDepartmentId === currentDepartmentId) {
        throw AppError.validation(
            "A department cannot be its own parent.",
            [
                {
                    path: ["parentDepartmentId"],
                    message:
                        "A department cannot be its own parent.",
                },
            ],
            {
                code: "DEPARTMENT_PARENT_SELF",
            },
        );
    }

    const parent =
        await departmentRepository.findParentDepartment(
            parentDepartmentId,
        );

    if (!parent) {
        throw AppError.notFound(
            "Parent department not found.",
            {
                code: DEPARTMENT_ERROR_CODES.PARENT_NOT_FOUND,
            },
        );
    }

    if (parent.organization_id !== organizationId) {
        throw AppError.conflict(
            "Parent department must belong to the same organization.",
            {
                code:
                    DEPARTMENT_ERROR_CODES.PARENT_DIFFERENT_ORGANIZATION,
            },
        );
    }

    if (parent.status !== "active") {
        throw AppError.conflict(
            "An inactive department cannot be used as a parent.",
            {
                code: "DEPARTMENT_PARENT_INACTIVE",
            },
        );
    }
}

async function listDepartments(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await departmentRepository.findDepartments({
            organizationId: query.organizationId,
            parentDepartmentId:
                query.parentDepartmentId,
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

async function createDepartment(data) {
    await validateOrganization(
        data.organizationId,
    );

    await validateParent(
        data.parentDepartmentId,
        data.organizationId,
    );

    if (
        await departmentRepository.findDepartmentByCode(
            data.organizationId,
            data.code,
        )
    ) {
        throw AppError.conflict(
            "A department with this code already exists in the organization.",
            {
                code: DEPARTMENT_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    if (
        await departmentRepository.findDepartmentByName(
            data.organizationId,
            data.name,
        )
    ) {
        throw AppError.conflict(
            "A department with this name already exists in the organization.",
            {
                code: DEPARTMENT_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await departmentRepository.createDepartment(
            data,
        );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A department with the supplied code or name already exists in the organization.",
                {
                    code: "DEPARTMENT_ALREADY_EXISTS",
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateDepartment(
    departmentId,
    data,
) {
    const existing =
        await getDepartment(departmentId);

    await validateParent(
        data.parentDepartmentId,
        existing.organization_id,
        departmentId,
    );

    if (data.name) {
        const duplicate =
            await departmentRepository.findDepartmentByName(
                existing.organization_id,
                data.name,
            );

        if (
            duplicate &&
            duplicate.id !== departmentId
        ) {
            throw AppError.conflict(
                "A department with this name already exists in the organization.",
                {
                    code: DEPARTMENT_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await departmentRepository.updateDepartment(
            departmentId,
            data,
        );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A department with the supplied name already exists in the organization.",
                {
                    code: "DEPARTMENT_ALREADY_EXISTS",
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateDepartment(
    departmentId,
) {
    const existing =
        await getDepartment(departmentId);

    const childCount =
        await departmentRepository.countChildren(
            departmentId,
        );

    if (childCount > 0) {
        throw AppError.conflict(
            "Department cannot be deactivated while child departments are associated with it.",
            {
                code: DEPARTMENT_ERROR_CODES.HAS_CHILDREN,
            },
        );
    }

    if (existing.status === "inactive") {
        return existing;
    }

    return departmentRepository.deactivateDepartment(
        departmentId,
    );
}

export default Object.freeze({
    listDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
});
