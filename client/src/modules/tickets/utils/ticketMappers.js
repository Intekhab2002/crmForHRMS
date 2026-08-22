/**
 * Maps a ticket returned by the backend API into the
 * client-side ticket model used by ticket components.
 *
 * Backend:
 *   snake_case
 *
 * Client:
 *   camelCase / UI-friendly names
 */
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

    createdByUserId: ticket.created_by_user_id,

    organizationId: ticket.organization_id,
    organization: ticket.organization_name ?? "",

    departmentId: ticket.department_id,
    department: ticket.department_name ?? "",

    contactId: ticket.contact_id,
    requesterPhone: ticket.contact_mobile_phone ?? "",

    assignedUserId: ticket.assigned_user_id,
    assignee: ticket.assignee_username ?? "",

    resolutionNotes: ticket.resolution_note ?? "",

    assignedAt: ticket.assigned_at,
    resolvedAt: ticket.resolved_at,
    closedAt: ticket.closed_at,

    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
}

/**
 * Maps a list of API tickets into the client ticket model.
 */
export function mapTicketsFromApi(tickets) {
  if (!Array.isArray(tickets)) {
    return [];
  }

  return tickets
    .map(mapTicketFromApi)
    .filter(Boolean);
}