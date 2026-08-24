import AppError from "../../helpers/AppError.js";

import ticketRepository from "./ticket.repository.js";
import { TICKET_ERROR_CODES, TICKET_STATUS } from "./ticket.constants.js";

import contactService from "../contacts/contact.service.js";
import database from "../../database/postgres.js";

import ticketLifecycleService from "./ticketLifecycle.service.js";
import {
  TICKET_LIFECYCLE_EVENT_TYPE,
  TICKET_LIFECYCLE_EVENT_ACTION,
} from "./ticketLifecycle.constants.js";
import ticketDynamicService from "./ticketDynamic.service.js";
import fieldStorageEngine from "../formConfiguration/engines/fieldStorage.engine.js";

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
  RESOLVED: new Set([TICKET_STATUS.CLOSED, TICKET_STATUS.REOPENED]),
  CLOSED: new Set([TICKET_STATUS.REOPENED]),
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
    throw AppError.notFound("Ticket not found.", {
      code: TICKET_ERROR_CODES.NOT_FOUND,
    });
  }

  return ticket;
}

async function validateReferences(data) {
  const [requester, organization, department] = await Promise.all([
    ticketRepository.findUser(data.requesterUserId),
    ticketRepository.findOrganization(data.organizationId),
    ticketRepository.findDepartment(data.departmentId),
  ]);

  if (!requester) {
    throw AppError.notFound("Requester user not found.", {
      code: TICKET_ERROR_CODES.REQUESTER_NOT_FOUND,
    });
  }

  if (requester.status !== "active") {
    throw AppError.conflict("Requester must have an active user account.", {
      code: TICKET_ERROR_CODES.REQUESTER_INACTIVE,
    });
  }

  if (!organization) {
    throw AppError.notFound("Organization not found.", {
      code: TICKET_ERROR_CODES.ORGANIZATION_NOT_FOUND,
    });
  }

  if (organization.status !== "active") {
    throw AppError.conflict("Ticket must belong to an active organization.", {
      code: TICKET_ERROR_CODES.ORGANIZATION_INACTIVE,
    });
  }

  if (!department) {
    throw AppError.notFound("Department not found.", {
      code: TICKET_ERROR_CODES.DEPARTMENT_NOT_FOUND,
    });
  }

  if (department.organization_id !== data.organizationId) {
    throw AppError.conflict(
      "Department does not belong to the selected organization.",
      {
        code: TICKET_ERROR_CODES.DEPARTMENT_DIFFERENT_ORGANIZATION,
      },
    );
  }

  if (department.status !== "active") {
    throw AppError.conflict("Ticket must belong to an active department.", {
      code: TICKET_ERROR_CODES.DEPARTMENT_INACTIVE,
    });
  }

  if (data.assignedUserId !== undefined && data.assignedUserId !== null) {
    const assignedUser = await ticketRepository.findAssignableUser(
      data.assignedUserId,
    );

    if (!assignedUser) {
      throw AppError.notFound("Assigned user not found.", {
        code: TICKET_ERROR_CODES.ASSIGNED_USER_NOT_FOUND,
      });
    }
  }
}

async function listTickets(query) {
  const result = await ticketRepository.findTickets({
    ...query,
    offset: (query.page - 1) * query.limit,
  });

  const totalPages =
    result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

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

async function createTicket(
    data,
    authenticatedUserId,
) {
    const {
        storage,
        dynamicPayload,
    } =
        await ticketDynamicService.prepareCreatePayload(
            data,
        );

    const normalized = {
        ...data,

        ...storage.relational,

        requesterUserId:
            data.requesterUserId ??
            authenticatedUserId,

        createdByUserId:
            authenticatedUserId,

        subject:
            storage.relational.subject ??
            data.subject ??
            "",

        description:
            storage.relational.description ??
            data.description ??
            "",

        issueType:
            data.issueType ??
            "GENERAL",

        priority:
            data.priority ??
            "MEDIUM",

        organizationId:
            storage.relational.organization_id ??
            data.organizationId,

        departmentId:
            storage.relational.department_id ??
            data.departmentId,

        assignedUserId:
            storage.relational.assigned_user_id  ??
            data.assignedUserId ??
            null,

        customData:
            storage.customData,
    };

    await validateReferences(
        normalized,
    );

    const client =
        await database.getClient();

    const tx = {
        client,
    };

    try {
        await client.query(
            "BEGIN",
        );

        const contact =
            await contactService.findOrCreateContact(
                {
                    organizationId:
                        normalized.organizationId,

                    name:
                        dynamicPayload.contact_name ??
                        normalized.contactName ??
                        "",

                    mobile:
                        dynamicPayload.mobile_phone ??
                        normalized.mobilePhone ??
                        "",
                },
                tx,
            );

        const ticket =
            await ticketRepository.createTicket(
                {
                    ...normalized,

                    contactId:
                        contact.id,

                    customData:
                        normalized.customData,
                },
                tx,
            );

        await ticketLifecycleService.record(
            {
                ticketId:
                    ticket.id,

                actorUserId:
                    authenticatedUserId,

                eventType:
                    TICKET_LIFECYCLE_EVENT_TYPE.TICKET,

                eventAction:
                    TICKET_LIFECYCLE_EVENT_ACTION.CREATED,

                metadata: {
                    subject:
                        ticket.subject,

                    status:
                        ticket.status,

                    dynamicFields:
                        Object.keys(
                            dynamicPayload,
                        ),
                },
            },
            tx,
        );

        await client.query(
            "COMMIT",
        );

        return ticket;
    } catch (error) {
        try {
            await client.query(
                "ROLLBACK",
            );
        } catch (rollbackError) {
            error.rollbackError =
                rollbackError;
        }

        throw error;
    } finally {
        client.release();
    }
}

async function updateTicket(
  ticketId,
  data,
  authenticatedUserId,
) {
  const current =
    await getTicket(ticketId);

  const {
    dynamicPayload,
    storage,
    fieldChanges,
  } =
    await ticketDynamicService
      .prepareUpdatePayload(
        data,
        current,
      );

  const effective = {
    ...current,

    requesterUserId:
      current.requester_user_id,

    organizationId:
      storage.relational.organization_id ??
      data.organizationId ??
      current.organization_id,

    departmentId:
      storage.relational.department_id ??
      data.departmentId ??
      current.department_id,

    assignedUserId:
      Object.prototype.hasOwnProperty.call(
        storage.relational,
        "assigned_user_id",
      )
        ? storage.relational.assigned_user_id
        : Object.prototype.hasOwnProperty.call(
            data,
            "assignedUserId",
          )
          ? data.assignedUserId
          : current.assigned_user_id,
  };

  await validateReferences(
    effective,
  );

  if (data.status) {
    if (
      data.status ===
      current.status
    ) {
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
      STATUS_TRANSITIONS[
        current.status
      ];

    if (
      !allowed?.has(
        data.status,
      )
    ) {
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
      data.status ===
        TICKET_STATUS.ASSIGNED &&
      !effective.assignedUserId
    ) {
      throw AppError.conflict(
        "An assignee is required before assigning a ticket.",
        {
          code:
            TICKET_ERROR_CODES
              .ASSIGNEE_REQUIRED,
        },
      );
    }

    if (
      data.status ===
        TICKET_STATUS.RESOLVED &&
      !data.resolutionNote &&
      !current.resolution_note
    ) {
      throw AppError.conflict(
        "A resolution note is required before resolving a ticket.",
        {
          code:
            TICKET_ERROR_CODES
              .RESOLUTION_REQUIRED,
        },
      );
    }
  }

  const mergedCustomData =
    fieldStorageEngine.mergeCustomData(
      current.custom_data,
      storage.customData,
    );

  const relational =
    storage.relational;

  const assignmentChanged =
    Object.prototype.hasOwnProperty.call(
      relational,
      "assigned_user_id",
    ) ||
    Object.prototype.hasOwnProperty.call(
      data,
      "assignedUserId",
    );

  const resolutionChanged =
    Object.prototype.hasOwnProperty.call(
      data,
      "resolutionNote",
    );

  const statusChanged =
    Object.prototype.hasOwnProperty.call(
      data,
      "status",
    );

  const client =
    await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query(
      "BEGIN",
    );

    const updatedTicket =
      await ticketRepository.updateTicket(
        ticketId,
        {
          subject:
            relational.subject,

          description:
            relational.description,

          issueType:
            data.issueType,

          priority:
            data.priority,

          organizationId:
            effective.organizationId,

          departmentId:
            effective.departmentId,

          assignedUserId:
            effective.assignedUserId,

          assignmentChanged,

          status:
            data.status,

          resolutionChanged,

          resolutionNote:
            data.resolutionNote,

          hasCustomData:
            Object.keys(
              storage.customData,
            ).length > 0,

          customData:
            mergedCustomData,
        },
        tx,
      );

    for (const change of fieldChanges) {
      await ticketLifecycleService.record(
        {
          ticketId,

          actorUserId:
            authenticatedUserId,

          eventType:
            TICKET_LIFECYCLE_EVENT_TYPE.FIELD,

          eventAction:
            TICKET_LIFECYCLE_EVENT_ACTION.UPDATED,

          fieldName:
            change.fieldKey,

          oldValue:
            change.oldValue,

          newValue:
            change.newValue,
        },
        tx,
      );
    }

    if (
      statusChanged &&
      data.status !==
        current.status
    ) {
      await ticketLifecycleService.record(
        {
          ticketId,

          actorUserId:
            authenticatedUserId,

          eventType:
            TICKET_LIFECYCLE_EVENT_TYPE.STATUS,

          eventAction:
            TICKET_LIFECYCLE_EVENT_ACTION.STATUS_CHANGED,

          fieldName:
            "status",

          oldValue:
            current.status,

          newValue:
            data.status,
        },
        tx,
      );
    }

    await client.query(
      "COMMIT",
    );

    return updatedTicket;
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK",
      );
    } catch (rollbackError) {
      error.rollbackError =
        rollbackError;
    }

    throw error;
  } finally {
    client.release();
  }
}

async function assignTicket(ticketId, userId, authenticatedUserId) {
  const ticket = await getTicket(ticketId);

  if (
    ticket.status === TICKET_STATUS.CLOSED ||
    ticket.status === TICKET_STATUS.RESOLVED
  ) {
    throw AppError.conflict("Resolved or closed tickets cannot be assigned.", {
      code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION,
    });
  }

  await validateReferences({
    requesterUserId: ticket.requester_user_id,
    organizationId: ticket.organization_id,
    departmentId: ticket.department_id,
    assignedUserId: userId,
  });

  const client = await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.assignTicket(
      ticketId,
      userId,
      tx,
    );

    const previousAssignee = ticket.assigned_user_id ?? null;

    let eventAction;

    if (!previousAssignee && userId) {
      eventAction = TICKET_LIFECYCLE_EVENT_ACTION.ASSIGNED;
    } else if (previousAssignee && previousAssignee !== userId) {
      eventAction = TICKET_LIFECYCLE_EVENT_ACTION.ASSIGNMENT_CHANGED;
    } else {
      eventAction = TICKET_LIFECYCLE_EVENT_ACTION.ASSIGNED;
    }

    await ticketLifecycleService.record(
      {
        ticketId,
        actorUserId: authenticatedUserId,

        eventType: TICKET_LIFECYCLE_EVENT_TYPE.ASSIGNMENT,

        eventAction,

        fieldName: "assignedUserId",

        oldValue: previousAssignee,

        newValue: userId,
      },
      tx,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  } finally {
    client.release();
  }
}

async function resolveTicket(ticketId, resolutionNote, authenticatedUserId) {
  const ticket = await getTicket(ticketId);

  if (
    ticket.status === TICKET_STATUS.CLOSED ||
    ticket.status === TICKET_STATUS.RESOLVED
  ) {
    throw AppError.conflict("Ticket is already resolved or closed.", {
      code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION,
    });
  }

  const normalizedResolutionNote = resolutionNote.trim();

  const client = await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.resolveTicket(
      ticketId,
      normalizedResolutionNote,
      tx,
    );

    await ticketLifecycleService.record(
      {
        ticketId,
        actorUserId: authenticatedUserId,

        eventType: TICKET_LIFECYCLE_EVENT_TYPE.STATUS,

        eventAction: TICKET_LIFECYCLE_EVENT_ACTION.RESOLVED,

        fieldName: "status",

        oldValue: ticket.status,

        newValue: TICKET_STATUS.RESOLVED,

        metadata: {
          resolutionNote: normalizedResolutionNote,
        },
      },
      tx,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  } finally {
    client.release();
  }
}

async function closeTicket(ticketId, authenticatedUserId) {
  const ticket = await getTicket(ticketId);

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw AppError.conflict("Ticket is already closed.", {
      code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION,
    });
  }

  const client = await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.closeTicket(ticketId, tx);

    await ticketLifecycleService.record(
      {
        ticketId,
        actorUserId: authenticatedUserId,

        eventType: TICKET_LIFECYCLE_EVENT_TYPE.STATUS,

        eventAction: TICKET_LIFECYCLE_EVENT_ACTION.CLOSED,

        fieldName: "status",

        oldValue: ticket.status,

        newValue: TICKET_STATUS.CLOSED,
      },
      tx,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  } finally {
    client.release();
  }
}

async function reopenTicket(ticketId, authenticatedUserId) {
  const ticket = await getTicket(ticketId);

  if (
    ticket.status !== TICKET_STATUS.RESOLVED &&
    ticket.status !== TICKET_STATUS.CLOSED
  ) {
    throw AppError.conflict(
      "Only resolved or closed tickets can be reopened.",
      {
        code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION,
      },
    );
  }

  const client = await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.reopenTicket(ticketId, tx);

    await ticketLifecycleService.record(
      {
        ticketId,
        actorUserId: authenticatedUserId,

        eventType: TICKET_LIFECYCLE_EVENT_TYPE.STATUS,

        eventAction: TICKET_LIFECYCLE_EVENT_ACTION.REOPENED,

        fieldName: "status",

        oldValue: ticket.status,

        newValue: TICKET_STATUS.REOPENED,
      },
      tx,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  } finally {
    client.release();
  }
}

async function getAssignableUsers() {
  return ticketRepository.findAssignableUsers();
}

async function getComments(ticketId) {
  await getTicket(ticketId);

  return ticketRepository.findTicketComments(ticketId);
}

async function addComment(
  ticketId,
  comment,
  authenticatedUserId,
) {
  await getTicket(ticketId);

  const normalizedComment = comment.trim();

  if (!normalizedComment) {
    throw AppError.badRequest("Comment is required.", {
      code: TICKET_ERROR_CODES.COMMENT_EMPTY,
    });
  }

  const client = await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query("BEGIN");

    const createdComment =
      await ticketRepository.createTicketComment(
        ticketId,
        authenticatedUserId,
        normalizedComment,
        tx,
      );

    await ticketLifecycleService.record(
      {
        ticketId,
        actorUserId: authenticatedUserId,
        eventType:
          TICKET_LIFECYCLE_EVENT_TYPE.COMMENT,
        eventAction:
          TICKET_LIFECYCLE_EVENT_ACTION.COMMENT_ADDED,
        metadata: {
          commentId: createdComment.id,
        },
      },
      tx,
    );

    await client.query("COMMIT");

    return createdComment;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  } finally {
    client.release();
  }
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
  getAssignableUsers,
  getComments,
  addComment,
});
