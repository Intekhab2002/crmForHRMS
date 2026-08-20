import AppError from "../../helpers/AppError.js";

import ticketRepository from "./ticket.repository.js";
import {
    TICKET_ERROR_CODES,
    TICKET_STATUS,
} from "./ticket.constants.js";

const STATUS_TRANSITIONS = Object.freeze({
    OPEN: new Set([
        TICKET_STATUS.ASSIGNED,
        TICKET_STATUS.IN_PROGRESS,
        TICKET_STATUS.PENDING,
        TICKET_STATUS.RESOLVED,
        TICKET_STATUS.CLOSED,
    ]),
    ASSIGNED: new Set([
        TICKET_STATUS.IN_PROGRESS,
        TICKET_STATUS.PENDING,
        TICKET_STATUS.RESOLVED,
        TICKET_STATUS.CLOSED,
    ]),
    IN_PROGRESS: new Set([
        TICKET_STATUS.PENDING,
        TICKET_STATUS.RESOLVED,
        TICKET_STATUS.CLOSED,
    ]),
    PENDING: new Set([
        TICKET_STATUS.IN_PROGRESS,
        TICKET_STATUS.RESOLVED,
        TICKET_STATUS.CLOSED,
    ]),
    RESOLVED: new Set([
        TICKET_STATUS.CLOSED,
        TICKET_STATUS.REOPENED,
    ]),
    CLOSED: new Set([
        TICKET_STATUS.REOPENED,
    ]),
    REOPENED: new Set([
        TICKET_STATUS.ASSIGNED,
        TICKET_STATUS.IN_PROGRESS,
        TICKET_STATUS.PENDING,
        TICKET_STATUS.RESOLVED,
        TICKET_STATUS.CLOSED,
    ]),
});

async function getTicket(ticketId) {
    const ticket = await ticketRepository.findTicketById(ticketId);

    if (!ticket) {
        throw AppError.notFound(
            "Ticket not found.",
            { code: TICKET_ERROR_CODES.NOT_FOUND },
        );
    }

    return ticket;
}

async function validateReferences(data) {
    const [requester, organization, department] =
        await Promise.all([
            ticketRepository.findUser(data.requesterUserId),
            ticketRepository.findOrganization(data.organizationId),
            ticketRepository.findDepartment(data.departmentId),
        ]);

    if (!requester) {
        throw AppError.notFound(
            "Requester user not found.",
            { code: TICKET_ERROR_CODES.REQUESTER_NOT_FOUND },
        );
    }

    if (requester.status !== "active") {
        throw AppError.conflict(
            "Requester must have an active user account.",
            { code: TICKET_ERROR_CODES.REQUESTER_INACTIVE },
        );
    }

    if (!organization) {
        throw AppError.notFound(
            "Organization not found.",
            { code: TICKET_ERROR_CODES.ORGANIZATION_NOT_FOUND },
        );
    }

    if (organization.status !== "active") {
        throw AppError.conflict(
            "Ticket must belong to an active organization.",
            { code: TICKET_ERROR_CODES.ORGANIZATION_INACTIVE },
        );
    }

    if (!department) {
        throw AppError.notFound(
            "Department not found.",
            { code: TICKET_ERROR_CODES.DEPARTMENT_NOT_FOUND },
        );
    }

    if (department.organization_id !== data.organizationId) {
        throw AppError.conflict(
            "Department does not belong to the selected organization.",
            {
                code:
                    TICKET_ERROR_CODES
                        .DEPARTMENT_DIFFERENT_ORGANIZATION,
            },
        );
    }

    if (department.status !== "active") {
        throw AppError.conflict(
            "Ticket must belong to an active department.",
            { code: TICKET_ERROR_CODES.DEPARTMENT_INACTIVE },
        );
    }

    if (
        data.assignedEmployeeId !== undefined &&
        data.assignedEmployeeId !== null
    ) {
        const employee =
            await ticketRepository.findEmployee(
                data.assignedEmployeeId,
            );

        if (!employee) {
            throw AppError.notFound(
                "Assigned employee not found.",
                { code: TICKET_ERROR_CODES.EMPLOYEE_NOT_FOUND },
            );
        }

        if (employee.status !== "active") {
            throw AppError.conflict(
                "Ticket can only be assigned to an active employee.",
                { code: TICKET_ERROR_CODES.EMPLOYEE_INACTIVE },
            );
        }

        if (employee.organization_id !== data.organizationId) {
            throw AppError.conflict(
                "Assigned employee must belong to the same organization.",
                {
                    code:
                        TICKET_ERROR_CODES
                            .EMPLOYEE_DIFFERENT_ORGANIZATION,
                },
            );
        }

        if (employee.department_id !== data.departmentId) {
            throw AppError.conflict(
                "Assigned employee must belong to the same department.",
                {
                    code:
                        TICKET_ERROR_CODES
                            .EMPLOYEE_DIFFERENT_DEPARTMENT,
                },
            );
        }
    }
}

async function listTickets(query) {
    const result = await ticketRepository.findTickets({
        ...query,
        offset: (query.page - 1) * query.limit,
    });

    const totalPages =
        result.total === 0
            ? 0
            : Math.ceil(result.total / query.limit);

    return {
        data: result.rows,
        meta: {
            page: query.page,
            limit: query.limit,
            total: result.total,
            totalPages,
            hasNextPage: query.page < totalPages,
            hasPreviousPage:
                query.page > 1 && totalPages > 0,
        },
    };
}

async function createTicket(data, authenticatedUserId) {
    const normalized = {
        ...data,
        requesterUserId:
            data.requesterUserId ?? authenticatedUserId,
        subject: data.subject.trim(),
        description: data.description.trim(),
        issueType: data.issueType.trim(),
    };

    await validateReferences(normalized);

    return ticketRepository.createTicket({
        ...normalized,
        createdByUserId: authenticatedUserId,
    });
}

async function updateTicket(ticketId, data) {
    const current = await getTicket(ticketId);

    const effective = {
        ...current,
        ...data,
        requesterUserId: current.requester_user_id,
        organizationId:
            data.organizationId ?? current.organization_id,
        departmentId:
            data.departmentId ?? current.department_id,
        assignedEmployeeId:
            Object.prototype.hasOwnProperty.call(
                data,
                "assignedEmployeeId",
            )
                ? data.assignedEmployeeId
                : current.assigned_employee_id,
    };

    await validateReferences(effective);

    if (data.status) {
        if (data.status === current.status) {
            throw AppError.conflict(
                "Ticket is already in the requested status.",
                {
                    code:
                        TICKET_ERROR_CODES
                            .INVALID_STATUS_TRANSITION,
                },
            );
        }

        const allowed =
            STATUS_TRANSITIONS[current.status];

        if (!allowed?.has(data.status)) {
            throw AppError.conflict(
                `Ticket cannot transition from ${current.status} to ${data.status}.`,
                {
                    code:
                        TICKET_ERROR_CODES
                            .INVALID_STATUS_TRANSITION,
                },
            );
        }

        if (
            data.status === TICKET_STATUS.ASSIGNED &&
            !effective.assignedEmployeeId
        ) {
            throw AppError.conflict(
                "An assignee is required before assigning a ticket.",
                { code: TICKET_ERROR_CODES.ASSIGNEE_REQUIRED },
            );
        }

        if (
            data.status === TICKET_STATUS.RESOLVED &&
            !data.resolutionNote &&
            !current.resolution_note
        ) {
            throw AppError.conflict(
                "A resolution note is required before resolving a ticket.",
                { code: TICKET_ERROR_CODES.RESOLUTION_REQUIRED },
            );
        }
    }

    return ticketRepository.updateTicket(ticketId, {
        ...data,
        subject: data.subject?.trim(),
        description: data.description?.trim(),
        issueType: data.issueType?.trim(),
    });
}

async function assignTicket(ticketId, employeeId) {
    const ticket = await getTicket(ticketId);

    if (
        ticket.status === TICKET_STATUS.CLOSED ||
        ticket.status === TICKET_STATUS.RESOLVED
    ) {
        throw AppError.conflict(
            "Resolved or closed tickets cannot be assigned.",
            { code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION },
        );
    }

    await validateReferences({
        requesterUserId: ticket.requester_user_id,
        organizationId: ticket.organization_id,
        departmentId: ticket.department_id,
        assignedEmployeeId: employeeId,
    });

    return ticketRepository.assignTicket(ticketId, employeeId);
}

async function resolveTicket(ticketId, resolutionNote) {
    const ticket = await getTicket(ticketId);

    if (
        ticket.status === TICKET_STATUS.CLOSED ||
        ticket.status === TICKET_STATUS.RESOLVED
    ) {
        throw AppError.conflict(
            "Ticket is already resolved or closed.",
            { code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION },
        );
    }

    return ticketRepository.resolveTicket(
        ticketId,
        resolutionNote.trim(),
    );
}

async function closeTicket(ticketId) {
    const ticket = await getTicket(ticketId);

    if (ticket.status === TICKET_STATUS.CLOSED) {
        throw AppError.conflict(
            "Ticket is already closed.",
            { code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION },
        );
    }

    return ticketRepository.closeTicket(ticketId);
}

async function reopenTicket(ticketId) {
    const ticket = await getTicket(ticketId);

    if (
        ticket.status !== TICKET_STATUS.RESOLVED &&
        ticket.status !== TICKET_STATUS.CLOSED
    ) {
        throw AppError.conflict(
            "Only resolved or closed tickets can be reopened.",
            { code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION },
        );
    }

    return ticketRepository.reopenTicket(ticketId);
}

async function deleteTicket(ticketId) {
    return closeTicket(ticketId);
}

export default Object.freeze({
    listTickets,
    getTicket,
    createTicket,
    updateTicket,
    assignTicket,
    resolveTicket,
    closeTicket,
    reopenTicket,
    deleteTicket,
});
