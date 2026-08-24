/**
 * Maps a ticket returned by the backend API into
 * the client-side ticket model.
 *
 * Backend:
 *   snake_case
 *
 * Client:
 *   camelCase
 */

function mapActor({ id, username, email, name } = {}) {
  return {
    id: id ?? null,
    name: name ?? username ?? email ?? "",
    email: email ?? "",
  };
}

function mapLifecycleActor(event) {
  return {
    id: event.actor_user_id ?? null,
    name: event.username ?? event.email ?? "System",
    email: event.email ?? "",
  };
}

function buildLifecycleSummary(event, metadata) {
  switch (event.event_action) {
    case "CREATED":
      return "Ticket was created.";

    case "UPDATED":
      return event.field_name
        ? `${event.field_name} was updated.`
        : "Ticket details were updated.";

    case "STATUS_CHANGED":
      return "Ticket status was changed.";

    case "ASSIGNED":
      return "Ticket was assigned.";

    case "UNASSIGNED":
      return "Ticket was unassigned.";

    case "COMMENT_ADDED":
      return "A comment was added.";

    case "ATTACHMENT_UPLOADED":
      return metadata.originalName
        ? `Attachment "${metadata.originalName}" was uploaded.`
        : "An attachment was uploaded.";

    case "ATTACHMENT_DELETED":
      return metadata.originalName
        ? `Attachment "${metadata.originalName}" was deleted.`
        : "An attachment was deleted.";

    case "RESOLVED":
      return "Ticket was resolved.";

    case "CLOSED":
      return "Ticket was closed.";

    case "REOPENED":
      return "Ticket was reopened.";

    default:
      return event.event_action
        ? event.event_action
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/^./, (character) => character.toUpperCase())
        : "Ticket activity.";
  }
}

function buildLifecycleChanges(event) {
  if (!event.field_name) {
    return [];
  }

  return [
    {
      field: event.field_name,
      label: formatLifecycleFieldName(event.field_name),
      from: event.old_value,
      to: event.new_value,
    },
  ];
}

function formatLifecycleFieldName(fieldName) {
  if (!fieldName) {
    return "Field";
  }

  return fieldName
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function buildLifecycleComment(event, metadata) {
  if (event.event_action !== "COMMENT_ADDED") {
    return null;
  }

  return metadata.comment ?? metadata.commentText ?? metadata.body ?? null;
}

function buildLifecycleFiles(event, metadata, fileSize) {
  if (event.event_type !== "ATTACHMENT" || !metadata.originalName) {
    return [];
  }

  return [
    {
      id: metadata.attachmentId ?? event.id,
      name: metadata.originalName,
      size: Number.isFinite(fileSize) ? fileSize : null,
      mimeType: metadata.mimeType ?? "",
      attachmentId: metadata.attachmentId ?? null,
    },
  ];
}

function mapLifecycleEvent(event) {
  if (!event) {
    return null;
  }

  const metadata =
    event.metadata && typeof event.metadata === "object" ? event.metadata : {};

  const fileSize =
    metadata.fileSize !== undefined && metadata.fileSize !== null
      ? Number(metadata.fileSize)
      : null;

  return {
    id: event.id,

    ticketId: event.ticket_id,

    actorUserId: event.actor_user_id,

    actor: mapLifecycleActor(event),

    type: event.event_type,
    action: event.event_action,

    fieldName: event.field_name ?? null,

    oldValue: event.old_value ?? null,
    newValue: event.new_value ?? null,

    metadata,

    createdAt: event.created_at,

    summary: buildLifecycleSummary(event, metadata),

    changes: buildLifecycleChanges(event),

    comment: buildLifecycleComment(event, metadata),

    files: buildLifecycleFiles(event, metadata, fileSize),
  };
}

export function mapTicketFromApi(ticket) {
  if (!ticket) {
    return null;
  }

  return {
    id: ticket.id,

    reference: ticket.ticket_number,
    subject: ticket.subject,
    description: ticket.description,
    issueType: ticket.issue_type,
    priority: ticket.priority,
    status: ticket.status,

    requesterUserId: ticket.requester_user_id,
    requesterName: ticket.contact_name ?? ticket.requester_username ?? "",
    requesterEmail: ticket.requester_email ?? "",
    requesterPhone: ticket.contact_mobile_phone ?? "",

    createdByUserId: ticket.created_by_user_id,
    createdBy: mapActor({
      id: ticket.created_by_user_id,
      username: ticket.created_by_username,
      email: ticket.created_by_email,
    }),

    organizationId: ticket.organization_id,
    organization: ticket.organization_name ?? "",

    departmentId: ticket.department_id,
    department: ticket.department_name ?? "",

    contactId: ticket.contact_id,

    assignedUserId: ticket.assigned_user_id,
    assignee: ticket.assignee_username ?? "",
    assigneeEmail: ticket.assignee_email ?? "",

    resolutionNotes: ticket.resolution_note ?? "",

    assignedAt: ticket.assigned_at ?? null,
    resolvedAt: ticket.resolved_at ?? null,
    closedAt: ticket.closed_at ?? null,

    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    customData:
      ticket.custom_data && typeof ticket.custom_data === "object"
        ? ticket.custom_data
        : {},

    /*
     * These will be populated when the backend
     * lifecycle/comment/attachment APIs are implemented.
     */
    comments: Array.isArray(ticket.comments) ? ticket.comments : [],

    attachments: Array.isArray(ticket.attachments) ? ticket.attachments : [],

    lifecycle: Array.isArray(ticket.lifecycle) ? ticket.lifecycle : [],
  };
}

export function mapTicketsFromApi(tickets) {
  if (!Array.isArray(tickets)) {
    return [];
  }

  return tickets.map(mapTicketFromApi).filter(Boolean);
}

export function mapLifecycleFromApi(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events.map(mapLifecycleEvent).filter(Boolean);
}
