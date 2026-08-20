import AppError from "../../helpers/AppError.js";
import employeeRepository from "./employee.repository.js";
import { EMPLOYEE_ERROR_CODES, EMPLOYEE_STATUS } from "./employee.constants.js";

function buildDisplayName(data) {
    return [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .map((value) => value.trim())
        .join(" ");
}

async function getEmployee(employeeId) {
    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee) {
        throw AppError.notFound("Employee not found.", {
            code: EMPLOYEE_ERROR_CODES.NOT_FOUND,
        });
    }
    return employee;
}

async function validateReferences(data, employeeId = null) {
    const [user, organization, department] = await Promise.all([
        employeeRepository.findUser(data.userId),
        employeeRepository.findOrganization(data.organizationId),
        employeeRepository.findDepartment(data.departmentId),
    ]);

    if (!user) throw AppError.notFound("User not found.", { code: EMPLOYEE_ERROR_CODES.USER_NOT_FOUND });
    if (user.status !== "active") throw AppError.conflict("Employee must be linked to an active user account.", { code: EMPLOYEE_ERROR_CODES.USER_INACTIVE });
    if (!organization) throw AppError.notFound("Organization not found.", { code: EMPLOYEE_ERROR_CODES.ORGANIZATION_NOT_FOUND });
    if (organization.status !== "active") throw AppError.conflict("Employee must belong to an active organization.", { code: EMPLOYEE_ERROR_CODES.ORGANIZATION_INACTIVE });
    if (!department) throw AppError.notFound("Department not found.", { code: EMPLOYEE_ERROR_CODES.DEPARTMENT_NOT_FOUND });
    if (department.organization_id !== data.organizationId) throw AppError.conflict("Department does not belong to the selected organization.", { code: EMPLOYEE_ERROR_CODES.DEPARTMENT_DIFFERENT_ORGANIZATION });
    if (department.status !== "active") throw AppError.conflict("Employee must belong to an active department.", { code: EMPLOYEE_ERROR_CODES.DEPARTMENT_INACTIVE });

    if (employeeId === null) {
        const linkedEmployee = await employeeRepository.findEmployeeByUserId(data.userId);
        if (linkedEmployee) throw AppError.conflict("This user is already linked to an employee.", { code: EMPLOYEE_ERROR_CODES.USER_ALREADY_LINKED });
    }

    if (data.managerId !== undefined && data.managerId !== null) {
        if (employeeId && data.managerId === employeeId) {
            throw AppError.conflict("An employee cannot be their own manager.", { code: EMPLOYEE_ERROR_CODES.SELF_MANAGER });
        }
        const manager = await employeeRepository.findManager(data.managerId);
        if (!manager) throw AppError.notFound("Manager employee not found.", { code: EMPLOYEE_ERROR_CODES.MANAGER_NOT_FOUND });
        if (manager.organization_id !== data.organizationId) throw AppError.conflict("Manager must belong to the same organization.", { code: EMPLOYEE_ERROR_CODES.MANAGER_DIFFERENT_ORGANIZATION });
        if (manager.status !== EMPLOYEE_STATUS.ACTIVE) throw AppError.conflict("Manager must be an active employee.", { code: EMPLOYEE_ERROR_CODES.MANAGER_INACTIVE });
    }
}

async function validateUpdateReferences(employeeId, data) {
    const current = await getEmployee(employeeId);
    const effective = {
        ...current,
        ...data,
        userId: current.user_id,
        organizationId: data.organizationId ?? current.organization_id,
        departmentId: data.departmentId ?? current.department_id,
        managerId: Object.prototype.hasOwnProperty.call(data, "managerId") ? data.managerId : current.manager_id,
    };
    await validateReferences(effective, employeeId);
    return current;
}

async function listEmployees(query) {
    const result = await employeeRepository.findEmployees({
        organizationId: query.organizationId,
        departmentId: query.departmentId,
        managerId: query.managerId,
        status: query.status,
        employmentType: query.employmentType,
        search: query.search,
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
    });

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / query.limit);
    return {
        data: result.rows,
        meta: {
            page: query.page,
            limit: query.limit,
            total: result.total,
            totalPages,
            hasNextPage: query.page < totalPages,
            hasPreviousPage: query.page > 1 && totalPages > 0,
        },
    };
}

async function createEmployee(data) {
    const normalized = {
        ...data,
        employeeNumber: data.employeeNumber.trim(),
        firstName: data.firstName.trim(),
        middleName: data.middleName?.trim() || null,
        lastName: data.lastName.trim(),
        displayName: buildDisplayName(data),
    };

    if (await employeeRepository.findEmployeeByNumber(normalized.employeeNumber)) {
        throw AppError.conflict("An employee with this employee number already exists.", { code: EMPLOYEE_ERROR_CODES.NUMBER_EXISTS });
    }

    await validateReferences(normalized);

    try {
        return await employeeRepository.createEmployee(normalized);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict("An employee with the supplied user or employee number already exists.", {
                code: "EMPLOYEE_ALREADY_EXISTS",
                cause: error,
            });
        }
        throw error;
    }
}

async function updateEmployee(employeeId, data) {
    const current = await validateUpdateReferences(employeeId, data);

    if (data.employeeNumber) {
        const duplicate = await employeeRepository.findEmployeeByNumber(data.employeeNumber);
        if (duplicate && duplicate.id !== employeeId) {
            throw AppError.conflict("An employee with this employee number already exists.", { code: EMPLOYEE_ERROR_CODES.NUMBER_EXISTS });
        }
    }

    const effectiveJoiningDate = data.joiningDate ?? current.joining_date;
    const effectiveLeavingDate = Object.prototype.hasOwnProperty.call(data, "leavingDate") ? data.leavingDate : current.leaving_date;
    if (effectiveLeavingDate && effectiveLeavingDate < effectiveJoiningDate) {
        throw AppError.conflict("Leaving date cannot be earlier than joining date.", { code: EMPLOYEE_ERROR_CODES.INVALID_LEAVING_DATE });
    }

    const normalized = {
        ...data,
        displayName: buildDisplayName({
            firstName: data.firstName ?? current.first_name,
            middleName: Object.prototype.hasOwnProperty.call(data, "middleName") ? data.middleName : current.middle_name,
            lastName: data.lastName ?? current.last_name,
        }),
    };

    return employeeRepository.updateEmployee(employeeId, normalized);
}

async function deactivateEmployee(employeeId) {
    const employee = await getEmployee(employeeId);
    if (employee.status === EMPLOYEE_STATUS.INACTIVE) return employee;
    return employeeRepository.deactivateEmployee(employeeId);
}

export default Object.freeze({
    listEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
});
