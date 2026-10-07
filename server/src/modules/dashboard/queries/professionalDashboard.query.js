import { getQueryExecutor } from "../../../database/queryExecutor.js";
import { buildTicketListWhereClause } from "../../tickets/ticketListQuery.js";

/*
 * Professional Dashboard currently exposes exactly these 12 ticket
 * dimensions. The registry is intentionally kept server-side so SQL
 * identifiers are never accepted from the HTTP request.
 */
const DIMENSIONS = Object.freeze({
  serviceType: Object.freeze({
    label: "Service Type Wise",
    filterKey: "serviceTypeId",
    valueExpression: "t.service_type_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN service_types dashboard_dimension
        ON dashboard_dimension.id = t.service_type_id
    `,
  }),

  district: Object.freeze({
    label: "District Wise",
    filterKey: "districtId",
    valueExpression: "contact.district_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN districts dashboard_dimension
        ON dashboard_dimension.id = contact.district_id
    `,
  }),

  department: Object.freeze({
    label: "Department Wise",
    filterKey: "departmentId",
    valueExpression: "t.department_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN departments dashboard_dimension
        ON dashboard_dimension.id = t.department_id
    `,
  }),

  category: Object.freeze({
    label: "Category Wise",
    filterKey: "categoryId",
    valueExpression: "t.category_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN ticket_categories dashboard_dimension
        ON dashboard_dimension.id = t.category_id
    `,
  }),

  problemStatement: Object.freeze({
    label: "Problem Statement Wise",
    filterKey: "problemStatementId",
    valueExpression: "t.problem_statement_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN problem_statements dashboard_dimension
        ON dashboard_dimension.id = t.problem_statement_id
    `,
  }),

  currentBillStatus: Object.freeze({
    label: "Current Bill Status Wise",
    filterKey: "currentBillStatusId",
    valueExpression: "t.current_bill_status_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN current_bill_statuses dashboard_dimension
        ON dashboard_dimension.id = t.current_bill_status_id
    `,
  }),

  status: Object.freeze({
    label: "Status Wise",
    filterKey: "status",
    valueExpression: "t.status_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN ticket_statuses dashboard_dimension
        ON dashboard_dimension.id = t.status_id
    `,
  }),

  assignedTo: Object.freeze({
    label: "Assigned To Wise",
    filterKey: "assignedUserId",
    valueExpression: "t.assigned_user_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: `
      COALESCE(
        NULLIF(
          TRIM(
            CONCAT_WS(
              ' ',
              dashboard_dimension.first_name,
              dashboard_dimension.last_name
            )
          ),
          ''
        ),
        dashboard_dimension.username,
        dashboard_dimension.email
      )
    `,
    join: `
      LEFT JOIN users dashboard_dimension
        ON dashboard_dimension.id = t.assigned_user_id
    `,
  }),

  severity: Object.freeze({
    label: "Severity Wise",
    filterKey: "severityId",
    valueExpression: "t.severity_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN ticket_severities dashboard_dimension
        ON dashboard_dimension.id = t.severity_id
    `,
  }),

  dependencyCategory: Object.freeze({
    label: "Dependency Category Wise",
    filterKey: "dependencyCategoryId",
    valueExpression: "t.dependency_category_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN ticket_dependency_categories dashboard_dimension
        ON dashboard_dimension.id = t.dependency_category_id
    `,
  }),

  issueCategory: Object.freeze({
    label: "Issue Category Wise",
    filterKey: "issueCategoryId",
    valueExpression: "t.issue_category_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: "dashboard_dimension.name",
    join: `
      LEFT JOIN ticket_issue_categories dashboard_dimension
        ON dashboard_dimension.id = t.issue_category_id
    `,
  }),

  createdBy: Object.freeze({
    label: "Created By Wise",
    filterKey: "createdByUserId",
    valueExpression: "t.created_by_user_id",
    keyExpression: "dashboard_dimension.id::text",
    labelExpression: `
      COALESCE(
        NULLIF(
          TRIM(
            CONCAT_WS(
              ' ',
              dashboard_dimension.first_name,
              dashboard_dimension.last_name
            )
          ),
          ''
        ),
        dashboard_dimension.username,
        dashboard_dimension.email
      )
    `,
    join: `
      LEFT JOIN users dashboard_dimension
        ON dashboard_dimension.id = t.created_by_user_id
    `,
  }),
});

const DASHBOARD_TO_TICKET_FILTERS = Object.freeze({
  periodStart: "createdFrom",
  periodEnd: "createdTo",
  departmentId: "departmentId",
  organizationId: "organizationId",
  assignedUserId: "assignedUserId",
  priority: "priority",
  category: "categoryId",
  status: "status",
});

function toTicketListFilters(filters = {}, dimensionFilterKey) {
  const result = {};

  for (const [sourceKey, targetKey] of Object.entries(
    DASHBOARD_TO_TICKET_FILTERS,
  )) {
    const value = filters[sourceKey];

    if (value !== undefined && value !== null && value !== "") {
      result[targetKey] = value;
    }
  }

  if (Array.isArray(filters.severity) && filters.severity.length > 0) {
    result.severityId = filters.severity;
  }

  /*
   * Do not constrain a distribution by its own dimension. If the user
   * later applies a dimension-specific global filter, the filter builder
   * can still be used for drill-down; the dashboard distribution itself
   * must represent all buckets.
   */
  delete result[dimensionFilterKey];

  return result;
}

function getLabelExpression(expression) {
  return `
    COALESCE(
      NULLIF(TRIM(${expression}), ''),
      'Not specified'
    )
  `;
}

export async function fetchDimensionDistribution(
  dimensionKey,
  filters = {},
  tx = null,
) {
  const dimension = DIMENSIONS[dimensionKey];

  if (!dimension) {
    throw new Error(
      `Unknown Professional Dashboard dimension: ${dimensionKey}`,
    );
  }

  const ticketFilters = toTicketListFilters(
    filters,
    dimension.filterKey,
  );

  const built = buildTicketListWhereClause(ticketFilters);

  const whereClause = built.whereClause
    ? built.whereClause.replace(/^WHERE\s+/i, "")
    : "TRUE";

  const query = `
    SELECT
      ${dimension.keyExpression} AS key,
      ${getLabelExpression(dimension.labelExpression)} AS label,
      COUNT(*)::int AS value
    FROM tickets t

    LEFT JOIN contacts contact
      ON contact.id = t.contact_id

    ${dimension.join}

    WHERE ${whereClause}

    GROUP BY
      ${dimension.keyExpression},
      ${dimension.labelExpression}

    ORDER BY
      value DESC,
      label ASC;
  `;

  const executor = getQueryExecutor(tx);
  const result = await executor.query(query, built.values);

  return result.rows.map((row) => ({
    key: row.key ?? "__NULL__",
    label: row.label ?? "Not specified",
    value: Number(row.value ?? 0),
    filterValue: row.key ?? null,
  }));
}

export function getProfessionalDimension(dimensionKey) {
  return DIMENSIONS[dimensionKey] ?? null;
}

export default Object.freeze({
  fetchDimensionDistribution,
  getProfessionalDimension,
});
