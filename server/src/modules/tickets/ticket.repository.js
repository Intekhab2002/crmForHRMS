import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";
import { getField } from "./ticket.config.js";

const TICKET_COLUMNS = Object.freeze([
  "id",
  "ticket_number",
  "subject",
  "description",
  "priority",
  "status_id",
  "requester_user_id",
  "created_by_user_id",
  "organization_id",
  "department_id",
  "assigned_user_id",
  "contact_id",
  "service_type_id",
  "category_id",
  "problem_statement_id",
  "employee_current_office_name_id",
  "employee_id",
  "current_bill_status_id",
  "bill_reference_no",
  "severity_id",
  "expected_resolution_date",
  "duplicate_ticket",
  "issue_category_id",
  "letter_no",
  "dependency_category_id",
  "initial_diagnosis",
  "solution",
  "resolution",
  "created_at",
  "updated_at",
]);

const SYSTEM_TICKET_COLUMNS = Object.freeze(["ticket_number"]);

const TICKET_SELECT = `
    t.id,
    t.ticket_number,
    t.subject,
    t.description,
    t.priority,

    t.status_id,
    ticket_status.code AS status_code,
    ticket_status.name AS status_name,

    t.requester_user_id,
COALESCE(
    NULLIF(
        TRIM(
            CONCAT_WS(
                ' ',
                creator.first_name,
                creator.last_name
            )
        ),
        ''
    ),
    creator.username,
    creator.email
) AS created_by_name,

    t.created_by_user_id,
COALESCE(
    NULLIF(
        TRIM(
            CONCAT_WS(
                ' ',
                creator.first_name,
                creator.last_name
            )
        ),
        ''
    ),
    creator.username,
    creator.email
) AS created_by_name,

    t.organization_id,
    organization.code AS organization_code,
    organization.name AS organization_name,

    t.department_id,
    department.code AS department_code,
    department.name AS department_name,

    t.assigned_user_id,
    TRIM(
        CONCAT_WS(
            ' ',
            assignee.first_name,
            assignee.last_name
        )
    ) AS assigned_user_name,

    t.contact_id,
    contact.name AS contact_name,
    contact.mobile_phone,
    contact.email AS contact_email,

    contact.district_id AS contact_district_id,
    district.code AS contact_district_code,
    district.name AS contact_district_name,

    contact.department_id AS contact_department_id,
    caller_department.code AS caller_department_code,
    caller_department.name AS caller_department_name,

    t.service_type_id,
    service_type.code AS service_type_code,
    service_type.name AS service_type_name,

    t.category_id,
    ticket_category.code AS category_code,
    ticket_category.name AS category_name,

    t.problem_statement_id,
    problem_statement.code AS problem_statement_code,
    problem_statement.name AS problem_statement_name,

    t.employee_current_office_name_id,
    t.employee_id,

    t.current_bill_status_id,
    current_bill_status.code AS current_bill_status_code,
    current_bill_status.name AS current_bill_status_name,

    t.bill_reference_no,

    t.severity_id,
    ticket_severity.code AS severity_code,
    ticket_severity.name AS severity_name,

    t.expected_resolution_date,
    t.duplicate_ticket,

    t.issue_category_id,
    issue_category.code AS issue_category_code,
    issue_category.name AS issue_category_name,

    t.letter_no,

    t.dependency_category_id,
    dependency_category.code AS dependency_category_code,
    dependency_category.name AS dependency_category_name,

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

    LEFT JOIN districts district
        ON district.id = contact.district_id

    LEFT JOIN service_types service_type
        ON service_type.id = t.service_type_id

    LEFT JOIN ticket_categories ticket_category
        ON ticket_category.id = t.category_id

    LEFT JOIN problem_statements problem_statement
        ON problem_statement.id = t.problem_statement_id

    LEFT JOIN current_bill_statuses current_bill_status
        ON current_bill_status.id = t.current_bill_status_id

    LEFT JOIN ticket_statuses ticket_status
        ON ticket_status.id = t.status_id

    LEFT JOIN ticket_severities ticket_severity
        ON ticket_severity.id = t.severity_id

    LEFT JOIN ticket_issue_categories issue_category
        ON issue_category.id = t.issue_category_id

    LEFT JOIN ticket_dependency_categories dependency_category
        ON dependency_category.id = t.dependency_category_id
`;

const RETURNING_COLUMNS = TICKET_COLUMNS.filter(
  (column) => !["created_at", "updated_at"].includes(column),
).join(",\n        ");

const FIND_TICKET_BY_ID = `
    SELECT
        ${TICKET_SELECT}
    ${FROM}
    WHERE t.id = $1::UUID
    LIMIT 1;
`;

const COUNT_TICKETS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM tickets t
    WHERE
        (
            $1::VARCHAR IS NULL
            OR t.ticket_number ILIKE '%' || $1::VARCHAR || '%'
            OR t.subject ILIKE '%' || $1::VARCHAR || '%'
            OR t.employee_id ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::UUID IS NULL
            OR t.status_id = $2::UUID
        )
        AND (
            $3::UUID IS NULL
            OR t.department_id = $3::UUID
        )
        AND (
            $4::UUID IS NULL
            OR t.assigned_user_id = $4::UUID
        )
        AND (
            $5::UUID IS NULL
            OR t.contact_id = $5::UUID
        );
`;

function getColumnForField(fieldKey) {
  const field = getField(fieldKey);

  if (!field || field.entity !== "ticket") {
    return null;
  }

  return field.column;
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

function toNestedObject(id, code, name) {
  if (!id) {
    return null;
  }

  return {
    id,
    code: code ?? null,
    name: name ?? null,
  };
}

function mapTicketRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    description: row.description,
    priority: row.priority,

    status: toNestedObject(row.status_id, row.status_code, row.status_name),

    requester: row.requester_user_id
      ? {
          id: row.requester_user_id,
          name: row.requester_name ?? null,
        }
      : null,

    createdBy: row.created_by_user_id
      ? {
          id: row.created_by_user_id,
          name: row.created_by_name ?? null,
        }
      : null,

    organization: row.organization_id
      ? {
          id: row.organization_id,
          code: row.organization_code ?? null,
          name: row.organization_name ?? null,
        }
      : null,

    department: row.department_id
      ? {
          id: row.department_id,
          code: row.department_code ?? null,
          name: row.department_name ?? null,
        }
      : null,

    assignedUser: row.assigned_user_id
      ? {
          id: row.assigned_user_id,
          name: row.assigned_user_name ?? null,
        }
      : null,

    contact: row.contact_id
      ? {
          id: row.contact_id,
          name: row.contact_name ?? null,
          mobilePhone: row.mobile_phone ?? null,
          email: row.contact_email ?? null,

          district: toNestedObject(
            row.contact_district_id,
            row.contact_district_code,
            row.contact_district_name,
          ),

          department: row.contact_department_id
            ? {
                id: row.contact_department_id,
                code: row.caller_department_code ?? null,
                name: row.caller_department_name ?? null,
              }
            : null,
        }
      : null,

    serviceType: toNestedObject(
      row.service_type_id,
      row.service_type_code,
      row.service_type_name,
    ),

    category: toNestedObject(
      row.category_id,
      row.category_code,
      row.category_name,
    ),

    problemStatement: toNestedObject(
      row.problem_statement_id,
      row.problem_statement_code,
      row.problem_statement_name,
    ),

    employeeCurrentOfficeNameId: row.employee_current_office_name_id,
    employeeId: row.employee_id,

    currentBillStatus: toNestedObject(
      row.current_bill_status_id,
      row.current_bill_status_code,
      row.current_bill_status_name,
    ),

    billReferenceNo: row.bill_reference_no,

    severity: toNestedObject(
      row.severity_id,
      row.severity_code,
      row.severity_name,
    ),

    expectedResolutionDate: row.expected_resolution_date,
    duplicateTicket: row.duplicate_ticket,

    issueCategory: toNestedObject(
      row.issue_category_id,
      row.issue_category_code,
      row.issue_category_name,
    ),

    letterNo: row.letter_no,

    dependencyCategory: toNestedObject(
      row.dependency_category_id,
      row.dependency_category_code,
      row.dependency_category_name,
    ),

    initialDiagnosis: row.initial_diagnosis,
    solution: row.solution,
    resolution: row.resolution,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findTicketById(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(FIND_TICKET_BY_ID, [id]);

  return mapTicketRow(result.rows[0] ?? null);
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
        SELECT
            ${TICKET_SELECT}
        ${FROM}
        WHERE
            (
                $1::VARCHAR IS NULL
                OR t.ticket_number ILIKE '%' || $1::VARCHAR || '%'
                OR t.subject ILIKE '%' || $1::VARCHAR || '%'
                OR t.employee_id ILIKE '%' || $1::VARCHAR || '%'
            )
            AND (
                $2::UUID IS NULL
                OR t.status_id = $2::UUID
            )
            AND (
                $3::UUID IS NULL
                OR t.department_id = $3::UUID
            )
            AND (
                $4::UUID IS NULL
                OR t.assigned_user_id = $4::UUID
            )
            AND (
                $5::UUID IS NULL
                OR t.contact_id = $5::UUID
            )
        ORDER BY t.created_at DESC
        LIMIT $6::INTEGER
        OFFSET $7::INTEGER;
    `;

  const [rowsResult, countResult] = await Promise.all([
    executor.query(listQuery, [...values, filters.limit, filters.offset]),
    executor.query(COUNT_TICKETS, values),
  ]);

  return {
    rows: rowsResult.rows.map(mapTicketRow),
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
    ...fieldKeys.map((key) => getColumnForField(key)),
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
        RETURNING id;
    `;

  const values = [
    data.id ?? randomUUID(),
    data.ticket_number,
    ...fieldKeys.map((key) => data[key]),
  ];

  const result = await executor.query(query, values);

  return findTicketById(result.rows[0].id, tx);
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

  if (!result.rows[0]) {
    return null;
  }

  return findTicketById(id, tx);
}

async function findUser(id, tx = null) {
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

async function findOrganization(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
        SELECT id, status
        FROM organizations
        WHERE id = $1::UUID
        LIMIT 1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function findDepartment(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
        SELECT
            id,
            is_active
        FROM departments
        WHERE id = $1::UUID
        LIMIT 1;
    `,
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
        SELECT
            id,
            organization_id,
            department_id
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
            u.username ASC;
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
