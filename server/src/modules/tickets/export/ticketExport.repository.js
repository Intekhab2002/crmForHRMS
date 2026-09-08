import database from "../../../database/postgres.js";

import { buildTicketListWhereClause } from "../ticketListQuery.js";

const TICKET_EXPORT_SELECT = `
    t.id,
    t.ticket_number,
    t.subject,
    t.description,
    t.priority,

    requester.first_name AS requester_first_name,
    requester.last_name AS requester_last_name,
    requester.username AS requester_username,
    requester.email AS requester_email,

    creator.first_name AS creator_first_name,
    creator.last_name AS creator_last_name,
    creator.username AS creator_username,
    creator.email AS creator_email,

    assignee.id AS assigned_user_id,
    assignee.first_name AS assigned_user_first_name,
    assignee.last_name AS assigned_user_last_name,
    assignee.username AS assigned_user_username,
    assignee.email AS assigned_user_email,

    contact.name AS contact_name,
    contact.mobile_phone AS contact_mobile_phone,
    contact.email AS contact_email,
    contact_district.name AS contact_district_name,
    contact_department.name AS contact_department_name,

    organization.name AS organization_name,
    department.name AS department_name,

    t.resolution_note,
    t.assigned_at,
    t.resolved_at,
    t.closed_at,

    t.employee_current_office_name_id AS employee_current_office_name,
    t.employee_id,
    t.bill_reference_no,
    t.expected_resolution_date,
    t.duplicate_ticket,
    t.letter_no,

    t.initial_diagnosis,
    t.solution,
    t.resolution,

    t.created_at,
    t.updated_at,

    service_type.name AS service_type_name,
    ticket_category.name AS category_name,
    problem_statement.name AS problem_statement_name,
    current_bill_status.name AS current_bill_status_name,
    ticket_status.name AS status_name,
    ticket_severity.name AS severity_name,
    issue_category.name AS issue_category_name,
    dependency_category.name AS dependency_category_name
`;

const TICKET_EXPORT_FROM = `
    FROM tickets t

    INNER JOIN users requester
        ON requester.id = t.requester_user_id

    LEFT JOIN users creator
        ON creator.id = t.created_by_user_id

    LEFT JOIN users assignee
        ON assignee.id = t.assigned_user_id

    LEFT JOIN contacts contact
        ON contact.id = t.contact_id

    LEFT JOIN districts contact_district
        ON contact_district.id = contact.district_id

    LEFT JOIN departments contact_department
        ON contact_department.id = contact.department_id

    INNER JOIN organizations organization
        ON organization.id = t.organization_id

    INNER JOIN departments department
        ON department.id = t.department_id

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

function buildCursorCondition(parameterIndex) {
  return `
    AND (
        $${parameterIndex}::TIMESTAMPTZ IS NULL
        OR t.created_at > $${parameterIndex}::TIMESTAMPTZ
        OR (
            t.created_at = $${parameterIndex}::TIMESTAMPTZ
            AND t.id > $${parameterIndex + 1}::UUID
        )
    )
  `;
}

function buildExportQuery({ mode, filters = {}, ticketIds = [] }) {
  const values = [];

  let whereClause = "";
  let upperBoundParameter;
  let cursorCreatedAtParameter;
  let cursorIdParameter;
  let limitParameter;

  if (mode === "selected") {
    values.push(ticketIds);

    const ticketIdsParameter = values.length;

    values.push(null);
    upperBoundParameter = values.length;

    values.push(null);
    cursorCreatedAtParameter = values.length;

    values.push(null);
    cursorIdParameter = values.length;

    values.push(null);
    limitParameter = values.length;

    whereClause = `
      WHERE
        t.id = ANY($${ticketIdsParameter}::UUID[])
        AND t.created_at < $${upperBoundParameter}::TIMESTAMPTZ
        ${buildCursorCondition(cursorCreatedAtParameter)}
    `;
  } else {
    const filterResult =
      mode === "filtered"
        ? buildTicketListWhereClause(filters)
        : {
            whereClause: "",
            values: [],
            nextParameterIndex: 1,
          };

    values.push(...filterResult.values);

    upperBoundParameter = filterResult.nextParameterIndex;

    values.push(null);

    cursorCreatedAtParameter = values.length;

    values.push(null);

    cursorIdParameter = values.length;

    values.push(null);

    limitParameter = values.length;

    whereClause = `
      ${filterResult.whereClause}

      ${filterResult.whereClause ? "AND" : "WHERE"}
        t.created_at < $${upperBoundParameter}::TIMESTAMPTZ

      ${buildCursorCondition(cursorCreatedAtParameter)}
    `;
  }

  const query = `
    SELECT
        ${TICKET_EXPORT_SELECT}
    ${TICKET_EXPORT_FROM}
    ${whereClause}
    ORDER BY
        t.created_at ASC,
        t.id ASC
    LIMIT $${limitParameter}::INTEGER
  `;

  return {
    query,
    values,
    parameterIndexes: {
      upperBoundParameter,
      cursorCreatedAtParameter,
      cursorIdParameter,
      limitParameter,
    },
  };
}

async function fetchTicketExportBatch({
  mode,
  filters = {},
  ticketIds = [],
  upperBound,
  cursorCreatedAt = null,
  cursorId = null,
  limit,
}) {
  const { query, values, parameterIndexes } = buildExportQuery({
    mode,
    filters,
    ticketIds,
  });

  values[parameterIndexes.upperBoundParameter - 1] = upperBound;

  values[parameterIndexes.cursorCreatedAtParameter - 1] = cursorCreatedAt;

  values[parameterIndexes.cursorIdParameter - 1] = cursorId;

  values[parameterIndexes.limitParameter - 1] = limit;

  const result = await database.query(query, values);

  return result.rows;
}

export { fetchTicketExportBatch };

export default Object.freeze({
  fetchTicketExportBatch,
});
