import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";
import { getField } from "./ticket.config.js";

const TICKET_COLUMNS = Object.freeze([
  "id",
  "ticket_number",
  "subject",
  "description",
  "priority",
  "status",
  "requester_user_id",
  "created_by_user_id",
  "organization_id",
  "department_id",
  "assigned_user_id",
  "contact_id",
  "service_type",
  "category",
  "problem_statement",
  "employee_current_office_name_id",
  "employee_id",
  "current_bill_status",
  "bill_reference_no",
  "severity",
  "expected_resolution_date",
  "duplicate_ticket",
  "issue_category",
  "letter_no",
  "dependency_category",
  "initial_diagnosis",
  "solution",
  "resolution",
  "created_at",
  "updated_at",
]);

const TICKET_COLUMN_SET = new Set(TICKET_COLUMNS);

function quoteIdentifier(identifier) {
  if (!TICKET_COLUMN_SET.has(identifier)) {
    throw new Error(`Unsupported ticket database column: ${identifier}`);
  }

  return `t.${identifier}`;
}
const SYSTEM_TICKET_COLUMNS = Object.freeze(["ticket_number"]);

const TICKET_SELECT = `
    t.id,
    t.ticket_number,
    t.subject,
    t.description,
    t.priority,
    t.status,
    t.requester_user_id,
    requester.display_name AS requester_name,
    t.created_by_user_id,
    creator.display_name AS created_by_name,
    t.organization_id,
    organization.name AS organization_name,
    t.department_id,
    department.name AS department_name,
    t.assigned_user_id,
    assignee.display_name AS assigned_user_name,
    t.contact_id,
    contact.name AS contact_name,
    contact.mobile_phone,
    contact.email AS contact_email,
    contact.district AS contact_district,
    contact.department_id AS contact_department_id,
    caller_department.name AS caller_department_name,
    t.service_type,
    t.category,
    t.problem_statement,
    t.employee_current_office_name_id,
    t.employee_id,
    t.current_bill_status,
    t.bill_reference_no,
    t.severity,
    t.expected_resolution_date,
    t.duplicate_ticket,
    t.issue_category,
    t.letter_no,
    t.dependency_category,
    t.initial_diagnosis,
    t.solution,
    t.resolution,
    t.created_at,
    t.updated_at
`;

const FROM = `
    FROM tickets t
    INNER JOIN users requester
        ON requester.id = t.requester_user_id
    LEFT JOIN users creator
        ON creator.id = t.created_by_user_id
    LEFT JOIN users assignee
        ON assignee.id = t.assigned_user_id
    LEFT JOIN organizations organization
        ON organization.id = t.organization_id
    INNER JOIN departments department
        ON department.id = t.department_id
    LEFT JOIN contacts contact
        ON contact.id = t.contact_id
    LEFT JOIN departments caller_department
        ON caller_department.id = contact.department_id
`;

const RETURNING_COLUMNS = TICKET_COLUMNS.filter(
  (column) => !["created_at", "updated_at"].includes(column),
)
  .map((column) => column)
  .join(",\n        ");

const FIND_TICKET_BY_ID = `
    SELECT ${TICKET_SELECT}
    ${FROM}
    WHERE t.id = $1::UUID
    LIMIT 1;
`;

const COUNT_TICKETS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM tickets t
    WHERE
        ($1::VARCHAR IS NULL
            OR t.ticket_number ILIKE '%' || $1::VARCHAR || '%'
            OR t.subject ILIKE '%' || $1::VARCHAR || '%'
            OR t.employee_id ILIKE '%' || $1::VARCHAR || '%')
        AND ($2::VARCHAR IS NULL OR t.status = $2::VARCHAR)
        AND ($3::UUID IS NULL OR t.department_id = $3::UUID)
        AND ($4::UUID IS NULL OR t.assigned_user_id = $4::UUID)
        AND ($5::UUID IS NULL OR t.contact_id = $5::UUID)
`;

function getColumnForField(fieldKey) {
  const field = getField(fieldKey);

  if (!field || field.entity !== "ticket") {
    return null;
  }

  return field.column;
}

function buildInsert(fields) {
  const columns = fields.map((fieldKey) => getColumnForField(fieldKey));

  if (columns.some((column) => !column)) {
    throw new Error("Ticket configuration contains an invalid insert field.");
  }

  const placeholders = columns.map((_, index) => `$${index + 2}`);

  return `
        INSERT INTO tickets (
            id,
            ${columns.join(",\n            ")}
        )
        VALUES (
            $1::UUID,
            ${placeholders.join(",\n            ")}
        )
        RETURNING ${RETURNING_COLUMNS};
    `;
}

function buildUpdate(fields) {
  const assignments = fields.map((fieldKey, index) => {
    const column = getColumnForField(fieldKey);
    if (!column) {
      throw new Error("Ticket configuration contains an invalid update field.");
    }
    return `${column} = $${index + 2}`;
  });

  return `
        UPDATE tickets t
        SET
            ${assignments.join(",\n            ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE t.id = $1::UUID
        RETURNING ${RETURNING_COLUMNS};
    `;
}

async function findTicketById(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_TICKET_BY_ID, [id]);
  return result.rows[0] ?? null;
}

async function findTickets(filters, tx = null) {
  const executor = getQueryExecutor(tx);

  const values = [
    filters.search ?? null,
    filters.status ?? null,
    filters.departmentId ?? null,
    filters.assignedUserId ?? null,
    filters.contactId ?? null,
  ];

  const listQuery = `
        SELECT ${TICKET_SELECT}
        ${FROM}
        WHERE
            ($1::VARCHAR IS NULL
                OR t.ticket_number ILIKE '%' || $1::VARCHAR || '%'
                OR t.subject ILIKE '%' || $1::VARCHAR || '%'
                OR t.employee_id ILIKE '%' || $1::VARCHAR || '%')
            AND ($2::VARCHAR IS NULL OR t.status = $2::VARCHAR)
            AND ($3::UUID IS NULL OR t.department_id = $3::UUID)
            AND ($4::UUID IS NULL OR t.assigned_user_id = $4::UUID)
            AND ($5::UUID IS NULL OR t.contact_id = $5::UUID)
        ORDER BY t.created_at DESC
        LIMIT $6::INTEGER
        OFFSET $7::INTEGER;
    `;

  const [rowsResult, countResult] = await Promise.all([
    executor.query(listQuery, [...values, filters.limit, filters.offset]),
    executor.query(COUNT_TICKETS, values),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

async function createTicket(data, tx = null) {
  const executor = getQueryExecutor(tx);

  const fieldKeys = Object.keys(data).filter(
    (key) =>
      key !== "id" &&
      !SYSTEM_TICKET_COLUMNS.includes(key) &&
      getColumnForField(key),
  );

  const columns = [
    "ticket_number",
    ...fieldKeys.map((fieldKey) => getColumnForField(fieldKey)),
  ];

  const placeholders = columns.map((_, index) => `$${index + 2}`);

  const query = `
        INSERT INTO tickets (
            id,
            ${columns.join(",\n            ")}
        )
        VALUES (
            $1::UUID,
            ${placeholders.join(",\n            ")}
        )
        RETURNING ${RETURNING_COLUMNS};
    `;

  const values = [
    data.id ?? randomUUID(),
    data.ticket_number,
    ...fieldKeys.map((key) => data[key]),
  ];

  const result = await executor.query(query, values);

  return result.rows[0];
}

async function updateTicket(id, data, tx = null) {
  const executor = getQueryExecutor(tx);
  const fieldKeys = Object.keys(data).filter((key) => getColumnForField(key));

  if (!fieldKeys.length) {
    return findTicketById(id, tx);
  }

  const query = buildUpdate(fieldKeys);
  const values = [id, ...fieldKeys.map((key) => data[key])];

  const result = await executor.query(query, values);
  return result.rows[0] ?? null;
}

async function findUser(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(
    `SELECT id, status FROM users WHERE id = $1::UUID LIMIT 1;`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function findOrganization(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(
    `SELECT id, status FROM organizations WHERE id = $1::UUID LIMIT 1;`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function findDepartment(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(
    `SELECT id, organization_id, status FROM departments WHERE id = $1::UUID LIMIT 1;`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function findUserForAssignment(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(
    `
            SELECT id, status
            FROM users
            WHERE id = $1::UUID
            LIMIT 1;
        `,
    [id],
  );
  return result.rows[0] ?? null;
}

async function findContact(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(
    `
            SELECT id, organization_id, department_id
            FROM contacts
            WHERE id = $1::UUID
            LIMIT 1;
        `,
    [id],
  );
  return result.rows[0] ?? null;
}

async function getAssignableUsers(tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            TRIM(
                CONCAT_WS(
                    ' ',
                    u.first_name,
                    u.last_name
                )
            ) AS full_name,
            u.username,
            u.email,
            u.mobile_phone,
            u.employee_code,
            u.designation
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
        ORDER BY
            u.first_name ASC,
            u.last_name ASC,
            u.username ASC
        `,
  );

  return result.rows;
}

export default Object.freeze({
  findTickets,
  findTicketById,
  createTicket,
  updateTicket,
  findUser,
  findOrganization,
  findDepartment,
  findUserForAssignment,
  findContact,
  getAssignableUsers,
});
