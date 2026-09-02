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
                code:
                    DEPARTMENT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return department;
}

async function listDepartments(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await departmentRepository.findDepartments({
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

async function createDepartment(data) {
    const existingByCode =
        await departmentRepository
            .findDepartmentByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A department with this code already exists.",
            {
                code:
                    DEPARTMENT_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await departmentRepository
            .findDepartmentByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A department with this name already exists.",
            {
                code:
                    DEPARTMENT_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await departmentRepository
            .createDepartment(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A department with the supplied code or name already exists.",
                {
                    code:
                        DEPARTMENT_ERROR_CODES.ALREADY_EXISTS,
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
   if (data.code) {
        const duplicate =
            await departmentRepository
                .findDepartmentByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== departmentId
        ) {
            throw AppError.conflict(
                "A department with this code already exists.",
                {
                    code:
                        DEPARTMENT_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await departmentRepository
                .findDepartmentByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== departmentId
        ) {
            throw AppError.conflict(
                "A department with this name already exists.",
                {
                    code:
                        DEPARTMENT_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await departmentRepository
            .updateDepartment(
                departmentId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A department with the supplied code or name already exists.",
                {
                    code:
                        DEPARTMENT_ERROR_CODES.ALREADY_EXISTS,
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
        await getDepartment(
            departmentId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return departmentRepository
        .deactivateDepartment(
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