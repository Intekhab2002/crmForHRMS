import { randomUUID } from "crypto";

import ticketLifecycleRepository from "./ticketLifecycle.repository.js";

async function record(
    {
        ticketId,
        actorUserId,
        eventType,
        eventAction,
        fieldName = null,
        oldValue = null,
        newValue = null,
        metadata = {},
    },
    tx = null,
) {
    if (!ticketId) {
        throw new Error(
            "ticketId is required to record ticket lifecycle event.",
        );
    }

    if (!actorUserId) {
        throw new Error(
            "actorUserId is required to record ticket lifecycle event.",
        );
    }

    return ticketLifecycleRepository.create(
        {
            id: randomUUID(),
            ticketId,
            actorUserId,
            eventType,
            eventAction,
            fieldName,
            oldValue,
            newValue,
            metadata,
        },
        tx,
    );
}

async function getTicketLifecycle(ticketId) {
    return ticketLifecycleRepository.findByTicket(ticketId);
}

function normalizeComparableValue(value) {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }

    return String(value);
}

function collectFieldChanges(current, data) {
    const fieldMap = [
        {
            input: "subject",
            database: "subject",
        },
        {
            input: "description",
            database: "description",
        },
        {
            input: "priority",
            database: "priority",
        },
        {
            input: "organizationId",
            database: "organization_id",
        },
        {
            input: "departmentId",
            database: "department_id",
        },
        {
            input: "assignedUserId",
            database: "assigned_user_id",
        },
        {
            input: "requesterUserId",
            database: "requester_user_id",
        },
    ];

    return fieldMap
        .filter(({ input }) =>
            Object.prototype.hasOwnProperty.call(data, input),
        )
        .map(({ input, database }) => {
            const oldValue =
                normalizeComparableValue(
                    current[database],
                );

            const newValue =
                normalizeComparableValue(
                    data[input],
                );

            if (oldValue === newValue) {
                return null;
            }

            return {
                fieldName: input,
                oldValue,
                newValue,
            };
        })
        .filter(Boolean);
}

export default Object.freeze({
    record,
    getTicketLifecycle,
    collectFieldChanges,
});