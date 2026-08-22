import { ApiResponse } from "../../helpers/ApiResponse.js";

import ticketService from "./ticket.service.js";
import { TICKET_MESSAGES } from "./ticket.constants.js";

async function getTickets(req, res, next) {
  try {
    const result = await ticketService.listTickets(
      req.validatedQuery ?? req.query,
    );

    return ApiResponse.paginated(
      res,
      result.data,
      result.meta,
      TICKET_MESSAGES.LIST_SUCCESS,
    );
  } catch (error) {
    return next(error);
  }
}

async function getTicket(req, res, next) {
  try {
    const ticket = await ticketService.getTicket(req.params.ticketId);

    return ApiResponse.success(res, ticket, TICKET_MESSAGES.GET_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function createTicket(req, res, next) {
  try {
    const ticket = await ticketService.createTicket(req.body, req.auth.userId);

    return ApiResponse.created(res, ticket, TICKET_MESSAGES.CREATE_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function updateTicket(ticketId, data, authenticatedUserId) {
  const current = await getTicket(ticketId);

  const effective = {
    ...current,
    ...data,
    requesterUserId: current.requester_user_id,
    organizationId: data.organizationId ?? current.organization_id,
    departmentId: data.departmentId ?? current.department_id,
    assignedUserId: Object.prototype.hasOwnProperty.call(data, "assignedUserId")
      ? data.assignedUserId
      : current.assigned_user_id,
  };

  await validateReferences(effective);

  if (data.status) {
    if (data.status === current.status) {
      throw AppError.conflict("Ticket is already in the requested status.", {
        code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION,
      });
    }

    const allowed = STATUS_TRANSITIONS[current.status];

    if (!allowed?.has(data.status)) {
      throw AppError.conflict(
        `Ticket cannot transition from ${current.status} to ${data.status}.`,
        {
          code: TICKET_ERROR_CODES.INVALID_STATUS_TRANSITION,
        },
      );
    }

    if (data.status === TICKET_STATUS.ASSIGNED && !effective.assignedUserId) {
      throw AppError.conflict(
        "An assignee is required before assigning a ticket.",
        {
          code: TICKET_ERROR_CODES.ASSIGNEE_REQUIRED,
        },
      );
    }

    if (
      data.status === TICKET_STATUS.RESOLVED &&
      !data.resolutionNote &&
      !current.resolution_note
    ) {
      throw AppError.conflict(
        "A resolution note is required before resolving a ticket.",
        {
          code: TICKET_ERROR_CODES.RESOLUTION_REQUIRED,
        },
      );
    }
  }

  const fieldChanges = ticketLifecycleService.collectFieldChanges(
    current,
    data,
  );

  const client = await database.getClient();

  const tx = {
    client,
  };

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicket(
      ticketId,
      {
        ...data,

        subject: data.subject?.trim(),

        description: data.description?.trim(),

        issueType: data.issueType?.trim(),
      },
      tx,
    );

    for (const change of fieldChanges) {
      if (change.fieldName === "status") {
        continue;
      }

      await ticketLifecycleService.record(
        {
          ticketId,

          actorUserId: authenticatedUserId,

          eventType: TICKET_LIFECYCLE_EVENT_TYPE.FIELD,

          eventAction: TICKET_LIFECYCLE_EVENT_ACTION.UPDATED,

          fieldName: change.fieldName,

          oldValue: change.oldValue,

          newValue: change.newValue,
        },
        tx,
      );
    }

    if (data.status && data.status !== current.status) {
      await ticketLifecycleService.record(
        {
          ticketId,

          actorUserId: authenticatedUserId,

          eventType: TICKET_LIFECYCLE_EVENT_TYPE.STATUS,

          eventAction: TICKET_LIFECYCLE_EVENT_ACTION.STATUS_CHANGED,

          fieldName: "status",

          oldValue: current.status,

          newValue: data.status,
        },
        tx,
      );
    }

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

async function assignTicket(req, res, next) {
  try {
    const ticket = await ticketService.assignTicket(
      req.params.ticketId,
      req.body.assignedUserId,
      req.auth.userId,
    );

    return ApiResponse.updated(res, ticket, TICKET_MESSAGES.ASSIGN_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function resolveTicket(req, res, next) {
  try {
    const ticket = await ticketService.resolveTicket(
      req.params.ticketId,
      req.body.resolutionNote,
      req.auth.userId,
    );

    return ApiResponse.updated(res, ticket, TICKET_MESSAGES.RESOLVE_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function closeTicket(req, res, next) {
  try {
    const ticket = await ticketService.closeTicket(
      req.params.ticketId,
      req.auth.userId,
    );

    return ApiResponse.updated(res, ticket, TICKET_MESSAGES.CLOSE_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function reopenTicket(req, res, next) {
  try {
    const ticket = await ticketService.reopenTicket(
      req.params.ticketId,
      req.auth.userId,
    );

    return ApiResponse.updated(res, ticket, TICKET_MESSAGES.REOPEN_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function deleteTicket(req, res, next) {
  try {
    const ticket = await ticketService.deleteTicket(
      req.params.ticketId,
      req.auth.userId,
    );

    return ApiResponse.deleted(res, ticket, TICKET_MESSAGES.DELETE_SUCCESS);
  } catch (error) {
    return next(error);
  }
}
async function getAssignableUsers(req, res, next) {
  try {
    const users = await ticketService.getAssignableUsers();

    return ApiResponse.success(
      res,
      users,
      TICKET_MESSAGES.ASSIGNABLE_USERS_SUCCESS,
    );
  } catch (error) {
    return next(error);
  }
}

async function getComments(req, res, next) {
  try {
    const comments = await ticketService.getComments(req.params.ticketId);

    return ApiResponse.success(res, comments, TICKET_MESSAGES.COMMENTS_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = await ticketService.addComment(
      req.params.ticketId,
      req.body.comment,
      req.auth.userId,
    );

    return ApiResponse.created(
      res,
      comment,
      TICKET_MESSAGES.COMMENT_CREATE_SUCCESS,
    );
  } catch (error) {
    return next(error);
  }
}

export default Object.freeze({
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  getAssignableUsers,
  getComments,
  addComment,
});
