function mapActor({
  id,
  username,
  email,
  name,
} = {}) {
  return {
    id: id ?? null,
    name:
      name ??
      username ??
      email ??
      "",
    email: email ?? "",
  };
}

function formatLifecycleFieldName(
  fieldName,
) {
  if (!fieldName) {
    return "Field";
  }

  return fieldName
    .replaceAll("_", " ")
    .replace(
      /([A-Z])/g,
      " $1",
    )
    .replace(
      /^./,
      (character) =>
        character.toUpperCase(),
    );
}

function mapLifecycleEvent(event) {
  if (!event) {
    return null;
  }

  const metadata =
    event.metadata &&
    typeof event.metadata === "object"
      ? event.metadata
      : {};

  const fieldName =
    event.field_name ?? null;

  const change = fieldName
    ? {
        field: fieldName,
        label:
          formatLifecycleFieldName(
            fieldName,
          ),
        from:
          event.old_value ?? null,
        to:
          event.new_value ?? null,
      }
    : null;

  return {
    id: event.id,
    ticketId: event.ticket_id,

    actorUserId:
      event.actor_user_id,

    actor: mapActor({
      id: event.actor_user_id,
      username: event.username,
      email: event.email,
      name: event.actor_name,
    }),

    type: event.event_type,
    action: event.event_action,

    fieldName,

    oldValue:
      event.old_value ?? null,

    newValue:
      event.new_value ?? null,

    changes: change
      ? [change]
      : [],

    comment:
      metadata.comment ?? null,

    files: Array.isArray(
      metadata.files,
    )
      ? metadata.files
      : [],

    metadata,

    createdAt:
      event.created_at,

    summary:
      event.field_name
        ? `${formatLifecycleFieldName(
            event.field_name,
          )} was updated.`
        : event.event_action
          ? event.event_action
              .replaceAll(
                "_",
                " ",
              )
              .toLowerCase()
              .replace(
                /^./,
                (character) =>
                  character.toUpperCase(),
              )
          : "Ticket activity.",
  };
}

export function mapTicketFromApi(
  ticket,
) {
  if (!ticket) {
    return null;
  }

  return {
    /*
     * Core ticket identity
     */
    id: ticket.id ?? null,

    ticketNumber:
      ticket.ticket_number ?? "",

    reference:
      ticket.ticket_number ?? "",

    /*
     * Core ticket fields
     */
    subject:
      ticket.subject ?? "",

    description:
      ticket.description ?? "",

    priority:
      ticket.priority ?? "",

    status:
      ticket.status ?? "",

    /*
     * Requester
     */
    requester_user_id:
      ticket.requester_user_id ?? "",

    requesterName:
      ticket.requester_name ?? "",

    /*
     * Organization
     */
    organization:
      ticket.organization_id ?? "",

    organizationName:
      ticket.organization_name ?? "",

    /*
     * Ticket department
     */
    department:
      ticket.department_id ?? "",

    departmentName:
      ticket.department_name ?? "",

    /*
     * Assignment
     */
    assigned_to:
      ticket.assigned_user_id ?? "",

    assignedUserName:
      ticket.assigned_user_name ?? "",

    /*
     * Created by
     */
    created_by:
      ticket.created_by_user_id ?? "",

    createdByName:
      ticket.created_by_name ?? "",

    /*
     * Contact
     */
    contact:
      ticket.contact_id ?? "",

    name:
      ticket.contact_name ?? "",

    contact_name:
      ticket.contact_name ?? "",

    mobile_phone:
      ticket.mobile_phone ?? "",

    mobilePhone:
      ticket.mobile_phone ?? "",

    email_id:
      ticket.contact_email ?? "",

    district:
      ticket.contact_district ?? "",

    /*
     * Caller department
     */
    caller_department:
      ticket.contact_department_id ?? "",

    callerDepartmentName:
      ticket.caller_department_name ??
      "",

    /*
     * Ticket business fields
     */
    service_type:
      ticket.service_type ?? "",

    category:
      ticket.category ?? "",

    problem_statement:
      ticket.problem_statement ?? "",

    employee_current_office_name_id:
      ticket.employee_current_office_name_id ??
      "",

    employee_id:
      ticket.employee_id ?? "",

    current_bill_status:
      ticket.current_bill_status ?? "",

    bill_reference_no:
      ticket.bill_reference_no ?? "",

    severity:
      ticket.severity ?? "",

    expected_resolution_date:
      ticket.expected_resolution_date ??
      "",

    duplicate_ticket:
      ticket.duplicate_ticket ?? "",

    issue_category:
      ticket.issue_category ?? "",

    letter_no:
      ticket.letter_no ?? "",

    dependency_category:
      ticket.dependency_category ?? "",

    initial_diagnosis:
      ticket.initial_diagnosis ?? "",

    solution:
      ticket.solution ?? "",

    resolution:
      ticket.resolution ?? "",

    /*
     * Lifecycle timestamps
     */
    assignedAt:
      ticket.assigned_at ?? null,

    resolvedAt:
      ticket.resolved_at ?? null,

    closedAt:
      ticket.closed_at ?? null,

    createdAt:
      ticket.created_at ?? null,

    updatedAt:
      ticket.updated_at ?? null,

    /*
     * Normalized actors
     */
    createdBy: mapActor({
      id:
        ticket.created_by_user_id,
      name:
        ticket.created_by_name,
    }),

    assignee: mapActor({
      id:
        ticket.assigned_user_id,
      name:
        ticket.assigned_user_name,
    }),

    requester: mapActor({
      id:
        ticket.requester_user_id,
      name:
        ticket.requester_name,
    }),

    /*
     * Related resources.
     *
     * These are populated by the page after
     * their respective API calls.
     */
    comments: Array.isArray(
      ticket.comments,
    )
      ? ticket.comments
      : [],

    attachments: Array.isArray(
      ticket.attachments,
    )
      ? ticket.attachments
      : [],

    lifecycle: Array.isArray(
      ticket.lifecycle,
    )
      ? ticket.lifecycle
      : [],
  };
}

export function mapTicketsFromApi(
  tickets,
) {
  if (!Array.isArray(tickets)) {
    return [];
  }

  return tickets
    .map(mapTicketFromApi)
    .filter(Boolean);
}

export function mapLifecycleFromApi(
  events,
) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map(mapLifecycleEvent)
    .filter(Boolean);
}

function mapCommentFromApi(
  comment,
) {
  if (!comment) {
    return null;
  }

  return {
    id: comment.id ?? null,

    ticketId:
      comment.ticketId ?? null,

    userId:
      comment.userId ?? null,

    comment:
      comment.comment ?? "",

    author: mapActor({
      id:
        comment.author?.id ??
        comment.userId,

      username:
        comment.author?.username,

      email:
        comment.author?.email,
    }),

    createdAt:
      comment.createdAt ?? null,

    updatedAt:
      comment.updatedAt ?? null,
  };
}

export function mapCommentsFromApi(
  comments,
) {
  if (!Array.isArray(comments)) {
    return [];
  }

  return comments
    .map(mapCommentFromApi)
    .filter(Boolean);
}