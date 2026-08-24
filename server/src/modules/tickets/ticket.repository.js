import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";

const TICKET_FIELDS = `
    t.id,
    t.ticket_number,
    t.subject,
    t.custom_data,
    t.description,
    t.issue_type,
    t.priority,
    t.status,
    t.requester_user_id,
    requester.username AS requester_username,
    requester.email AS requester_email,
    t.created_by_user_id,
    t.organization_id,
    organization.name AS organization_name,
    t.department_id,
    department.name AS department_name,
    t.contact_id,
    contact.name AS contact_name,
    contact.mobile_phone AS contact_mobile_phone,
    t.assigned_user_id,
    assignee.username AS assignee_username,
    assignee.email AS assignee_email,
    t.resolution_note,
    t.assigned_at,
    t.resolved_at,
    t.closed_at,
    t.created_at,
    t.updated_at
`;

const TICKET_FROM = `
    FROM tickets t
    INNER JOIN users requester
        ON requester.id = t.requester_user_id
    INNER JOIN organizations organization
        ON organization.id = t.organization_id
    INNER JOIN departments department
        ON department.id = t.department_id
    LEFT JOIN contacts contact
        ON contact.id = t.contact_id
    LEFT JOIN users assignee
        ON assignee.id = t.assigned_user_id
`;

const TICKET_RETURNING_FIELDS = `
    id,
    ticket_number,
    subject,
    custom_data,
    description,
    issue_type,
    priority,
    status,
    requester_user_id,
    created_by_user_id,
    organization_id,
    department_id,
    contact_id,
    assigned_user_id,
    resolution_note,
    assigned_at,
    resolved_at,
    closed_at,
    created_at,
    updated_at
`;

const FIND_TICKETS = `
    SELECT
        ${TICKET_FIELDS}
    ${TICKET_FROM}
    WHERE
        ($1::VARCHAR IS NULL
            OR t.ticket_number ILIKE '%' || $1::VARCHAR || '%'
            OR t.subject ILIKE '%' || $1::VARCHAR || '%')
        AND ($2::VARCHAR IS NULL OR t.status = $2::VARCHAR)
        AND ($3::VARCHAR IS NULL OR t.priority = $3::VARCHAR)
        AND ($4::UUID IS NULL OR t.organization_id = $4::UUID)
        AND ($5::UUID IS NULL OR t.department_id = $5::UUID)
        AND ($6::UUID IS NULL OR t.requester_user_id = $6::UUID)
AND ($7::UUID IS NULL OR t.assigned_user_id = $7::UUID)
    ORDER BY t.created_at DESC
    LIMIT $8::INTEGER
    OFFSET $9::INTEGER;
`;

const COUNT_TICKETS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM tickets t
    WHERE
        ($1::VARCHAR IS NULL
            OR t.ticket_number ILIKE '%' || $1::VARCHAR || '%'
            OR t.subject ILIKE '%' || $1::VARCHAR || '%')
        AND ($2::VARCHAR IS NULL OR t.status = $2::VARCHAR)
        AND ($3::VARCHAR IS NULL OR t.priority = $3::VARCHAR)
        AND ($4::UUID IS NULL OR t.organization_id = $4::UUID)
        AND ($5::UUID IS NULL OR t.department_id = $5::UUID)
        AND ($6::UUID IS NULL OR t.requester_user_id = $6::UUID)
AND ($7::UUID IS NULL OR t.assigned_user_id = $7::UUID)`;

const FIND_TICKET_BY_ID = `
    SELECT
        ${TICKET_FIELDS}
    ${TICKET_FROM}
    WHERE t.id = $1::UUID
    LIMIT 1;
`;

const FIND_USER = `
    SELECT id, status
    FROM users
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_ORGANIZATION = `
    SELECT id, status
    FROM organizations
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_DEPARTMENT = `
    SELECT id, organization_id, status
    FROM departments
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_EMPLOYEE = `
    SELECT id, organization_id, department_id, status
    FROM employees
    WHERE id = $1::UUID
    LIMIT 1;
`;

const CREATE_TICKET = `
    INSERT INTO tickets (
        id,
        ticket_number,
        subject,
        custom_data,
        description,
        issue_type,
        priority,
        status,
        requester_user_id,
        created_by_user_id,
        organization_id,
        department_id,
        contact_id,
        assigned_user_id,
        assigned_at
    )
    VALUES (
        $1::UUID,

        'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
            LPAD(
                NEXTVAL('ticket_number_seq')::TEXT,
                6,
                '0'
            ),

        $2::VARCHAR,
        $3::JSONB,
        $4::TEXT,
        $5::VARCHAR,
        $6::VARCHAR,

        $7::VARCHAR,

        $8::UUID,
        $9::UUID,
        $10::UUID,
        $11::UUID,
        $12::UUID,
        $13::UUID,

        CASE
            WHEN $12::UUID IS NOT NULL
                THEN CURRENT_TIMESTAMP
            ELSE NULL
        END
    )

    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const UPDATE_TICKET = `
    UPDATE tickets
    SET
        subject = COALESCE($2::VARCHAR, subject),
        description = COALESCE($3::TEXT, description),
        issue_type = COALESCE($4::VARCHAR, issue_type),
        priority = COALESCE($5::VARCHAR, priority),
        organization_id = COALESCE($6::UUID, organization_id),
        department_id = COALESCE($7::UUID, department_id),
        assigned_user_id =
            CASE
                WHEN $8::BOOLEAN THEN $9::UUID
                ELSE assigned_user_id
            END,
        status = COALESCE($10::VARCHAR, status),
        resolution_note =
            CASE
                WHEN $11::BOOLEAN THEN $12::TEXT
                ELSE resolution_note
            END,
        assigned_at =
            CASE
                WHEN $8::BOOLEAN AND $9::UUID IS NOT NULL
                    THEN COALESCE(assigned_at, CURRENT_TIMESTAMP)
                WHEN $8::BOOLEAN AND $9::UUID IS NULL
                    THEN NULL
                ELSE assigned_at
            END,
        resolved_at =
            CASE
                WHEN $10::VARCHAR = 'RESOLVED'
                    THEN COALESCE(resolved_at, CURRENT_TIMESTAMP)
                WHEN $10::VARCHAR IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'REOPENED')
                    THEN NULL
                ELSE resolved_at
            END,
        closed_at =
            CASE
                WHEN $10::VARCHAR = 'CLOSED'
                    THEN COALESCE(closed_at, CURRENT_TIMESTAMP)
                WHEN $10::VARCHAR <> 'CLOSED'
                    THEN NULL
                ELSE closed_at
            END
    WHERE id = $1::UUID
    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const ASSIGN_TICKET = `
    UPDATE tickets
    SET
        assigned_user_id = $2::UUID,
        assigned_at = CURRENT_TIMESTAMP,
        status = CASE
            WHEN status IN ('OPEN', 'REOPENED') THEN 'ASSIGNED'
            ELSE status
        END
    WHERE id = $1::UUID
    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const RESOLVE_TICKET = `
    UPDATE tickets
    SET
        status = 'RESOLVED',
        resolution_note = $2::TEXT,
        resolved_at = CURRENT_TIMESTAMP
    WHERE id = $1::UUID
    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const CLOSE_TICKET = `
    UPDATE tickets
    SET
        status = 'CLOSED',
        closed_at = CURRENT_TIMESTAMP,
        resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP)
    WHERE id = $1::UUID
    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const REOPEN_TICKET = `
    UPDATE tickets
    SET
        status = 'REOPENED',
        resolved_at = NULL,
        closed_at = NULL,
        resolution_note = NULL
    WHERE id = $1::UUID
    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const DELETE_TICKET = `
    UPDATE tickets
    SET
        status = 'CLOSED',
        closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP)
    WHERE id = $1::UUID
    RETURNING ${TICKET_RETURNING_FIELDS};
`;

const FIND_ASSIGNABLE_USERS = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status
    FROM users u
    WHERE u.status = 'active'
      AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles r
              ON r.id = ur.role_id
          WHERE ur.user_id = u.id
            AND LOWER(r.code) = 'developer'
            AND r.is_active = TRUE
      )
    ORDER BY u.username ASC;
`;

const FIND_CONTACT = `
    SELECT
        id,
        organization_id,
        name,
        mobile_phone
    FROM contacts
    WHERE organization_id = $1::UUID
      AND mobile_phone = $2::VARCHAR
    LIMIT 1;
`;

const FIND_ASSIGNABLE_USER = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status
    FROM users u
    WHERE u.id = $1::UUID
      AND u.status = 'active'
      AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles r
              ON r.id = ur.role_id
          WHERE ur.user_id = u.id
            AND LOWER(r.code) = 'developer'
            AND r.is_active = TRUE
      )
    LIMIT 1;
`;

const FIND_TICKET_COMMENTS = `
    SELECT
        tc.id,
        tc.ticket_id,
        tc.user_id,
        u.username,
        u.email,
        tc.comment,
        tc.created_at,
        tc.updated_at
    FROM ticket_comments tc
    INNER JOIN users u
        ON u.id = tc.user_id
    WHERE tc.ticket_id = $1::UUID
    ORDER BY tc.created_at DESC;
`;

const CREATE_TICKET_COMMENT = `
    INSERT INTO ticket_comments (
        id,
        ticket_id,
        user_id,
        comment
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4::TEXT
    )
    RETURNING
        id,
        ticket_id,
        user_id,
        comment,
        created_at,
        updated_at;
`;
async function findTickets(filters, tx = null) {
  const executor = getQueryExecutor(tx);

  const values = [
    filters.search ?? null,
    filters.status ?? null,
    filters.priority ?? null,
    filters.organizationId ?? null,
    filters.departmentId ?? null,
    filters.requesterUserId ?? null,
    filters.assignedUserId ?? null,
  ];

  const [rowsResult, countResult] = await Promise.all([
    executor.query(FIND_TICKETS, [...values, filters.limit, filters.offset]),
    executor.query(COUNT_TICKETS, values),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

async function findTicketById(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_TICKET_BY_ID, [id]);
  return result.rows[0] ?? null;
}

async function findUser(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_USER, [id]);
  return result.rows[0] ?? null;
}

async function findOrganization(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_ORGANIZATION, [id]);
  return result.rows[0] ?? null;
}

async function findDepartment(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_DEPARTMENT, [id]);
  return result.rows[0] ?? null;
}

async function findEmployee(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_EMPLOYEE, [id]);
  return result.rows[0] ?? null;
}

async function findAssignableUser(
    id,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_ASSIGNABLE_USER,
        [id],
    );

    return result.rows[0] ?? null;
}

async function createTicket(data, tx) {
    const executor =
        tx?.client ??
        getQueryExecutor();

    const result =
        await executor.query(
            CREATE_TICKET,
            [
                data.id,
                data.subject,
                JSON.stringify(
                    data.customData ?? {},
                ),
                data.description,
                data.issueType,
                data.priority,
                data.status ?? "OPEN",
                data.requesterUserId,
                data.createdByUserId,
                data.organizationId,
                data.departmentId,
                data.contactId,
                data.assignedUserId,
            ],
        );

    return result.rows[0];
}

async function updateTicket(ticketId, data, tx = null) {
  const executor = getQueryExecutor(tx);

  const has = (key) => Object.prototype.hasOwnProperty.call(data, key);

  const result = await executor.query(UPDATE_TICKET, [
    ticketId,
    data.subject ?? null,
    data.description ?? null,
    data.issueType ?? null,
    data.priority ?? null,
    data.organizationId ?? null,
    data.departmentId ?? null,
    has("assignedUserId"),
    data.assignedUserId ?? null,
    data.status ?? null,
    has("resolutionNote"),
    data.resolutionNote ?? null,
  ]);

  return result.rows[0] ?? null;
}

async function assignTicket(ticketId, userId, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    ASSIGN_TICKET,
    [
      ticketId,
      userId,
    ],
  );

  return result.rows[0] ?? null;
}

async function resolveTicket(ticketId, resolutionNote, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(RESOLVE_TICKET, [
    ticketId,
    resolutionNote,
  ]);
  return result.rows[0] ?? null;
}

async function closeTicket(ticketId, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(CLOSE_TICKET, [ticketId]);
  return result.rows[0] ?? null;
}

async function reopenTicket(ticketId, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(REOPEN_TICKET, [ticketId]);
  return result.rows[0] ?? null;
}

async function deleteTicket(ticketId, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(DELETE_TICKET, [ticketId]);
  return result.rows[0] ?? null;
}

async function findAssignableUsers(tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(FIND_ASSIGNABLE_USERS);

  return result.rows;
}

async function findTicketComments(ticketId, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    FIND_TICKET_COMMENTS,
    [ticketId],
  );

  return result.rows;
}
async function createTicketComment(
  ticketId,
  userId,
  comment,
  tx = null,
) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    CREATE_TICKET_COMMENT,
    [
      randomUUID(),
      ticketId,
      userId,
      comment,
    ],
  );

  return result.rows[0];
}

export default Object.freeze({
  findTickets,
  findTicketById,
  findUser,
  findOrganization,
  findDepartment,
  findEmployee,
  createTicket,
  updateTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  findAssignableUsers,
  findAssignableUser,
    findTicketComments,
  createTicketComment,
});
