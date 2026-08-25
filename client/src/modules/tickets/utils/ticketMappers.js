function mapActor({ id, username, email, name } = {}) {
  return {
    id: id ?? null,
    name: name ?? username ?? email ?? "",
    email: email ?? "",
  };
}

function formatLifecycleFieldName(fieldName) {
  if (!fieldName) return "Field";

  return fieldName
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
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
        label: formatLifecycleFieldName(
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
      metadata.comment ??
      null,

    files:
      Array.isArray(metadata.files)
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

export function mapTicketFromApi(ticket) {
  if (!ticket) return null;

  return {
    id: ticket.id,
    ticketNumber:ticket.ticket_number,
    mobilePhone: ticket.mobile_phone,
    reference: ticket.ticket_number,
    subject: ticket.subject ?? "",
    description: ticket.description ?? "",
    priority: ticket.priority ?? "",
    status: ticket.status ?? "",

    department: ticket.department_id ?? "",
    departmentName: ticket.department_name ?? "",

    assigned_to: ticket.assigned_user_id ?? "",
    assignedUserName: ticket.assigned_user_name ?? "",

    created_by: ticket.created_by_user_id ?? "",
    createdByName: ticket.created_by_name ?? "",

    organization: ticket.organization_id ?? "",
    organizationName: ticket.organization_name ?? "",

    contact: ticket.contact_id ?? "",

    name: ticket.contact_name ?? "",
    contact_name: ticket.contact_name ?? "",
    mobile_phone: ticket.mobile_phone ?? "",
    email_id: ticket.contact_email ?? "",
    district: ticket.contact_district ?? "",
    caller_department: ticket.contact_department_id ?? "",

    service_type: ticket.service_type ?? "",
    category: ticket.category ?? "",
    problem_statement: ticket.problem_statement ?? "",
    employee_current_office_name_id:
      ticket.employee_current_office_name_id ?? "",
    employee_id: ticket.employee_id ?? "",
    current_bill_status: ticket.current_bill_status ?? "",
    bill_reference_no: ticket.bill_reference_no ?? "",
    severity: ticket.severity ?? "",
    expected_resolution_date:
      ticket.expected_resolution_date ?? "",
    duplicate_ticket: ticket.duplicate_ticket ?? "",
    issue_category: ticket.issue_category ?? "",
    letter_no: ticket.letter_no ?? "",
    dependency_category: ticket.dependency_category ?? "",
    initial_diagnosis: ticket.initial_diagnosis ?? "",
    solution: ticket.solution ?? "",
    resolution: ticket.resolution ?? "",

    assignedAt: ticket.assigned_at ?? null,
    resolvedAt: ticket.resolved_at ?? null,
    closedAt: ticket.closed_at ?? null,
    createdAt: ticket.created_at ?? null,
    updatedAt: ticket.updated_at ?? null,

    createdBy: mapActor({
      id: ticket.created_by_user_id,
      name: ticket.created_by_name,
    }),

    assignee: mapActor({
      id: ticket.assigned_user_id,
      name: ticket.assigned_user_name,
    }),

    comments: Array.isArray(ticket.comments) ? ticket.comments : [],
    attachments: Array.isArray(ticket.attachments)
      ? ticket.attachments
      : [],
    lifecycle: Array.isArray(ticket.lifecycle)
      ? ticket.lifecycle
      : [],
  };
}

export function mapTicketsFromApi(tickets) {
  if (!Array.isArray(tickets)) return [];
  return tickets.map(mapTicketFromApi).filter(Boolean);
}

export function mapLifecycleFromApi(events) {
  if (!Array.isArray(events)) return [];
  return events.map(mapLifecycleEvent).filter(Boolean);
}
