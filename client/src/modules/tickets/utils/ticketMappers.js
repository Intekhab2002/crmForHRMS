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

function mapActor({
  id,
  username,
  email,
  name,
} = {}) {
  return {
    id: id ?? null,
    name: name ?? username ?? email ?? "",
    email: email ?? "",
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
    requesterName:
      ticket.contact_name ??
      ticket.requester_username ??
      "",
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

    /*
     * These will be populated when the backend
     * lifecycle/comment/attachment APIs are implemented.
     */
    comments: Array.isArray(ticket.comments)
      ? ticket.comments
      : [],

    attachments: Array.isArray(ticket.attachments)
      ? ticket.attachments
      : [],

    lifecycle: Array.isArray(ticket.lifecycle)
      ? ticket.lifecycle
      : [],
  };
}

export function mapTicketsFromApi(tickets) {
  if (!Array.isArray(tickets)) {
    return [];
  }

  return tickets
    .map(mapTicketFromApi)
    .filter(Boolean);
}