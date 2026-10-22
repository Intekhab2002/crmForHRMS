import { TICKET_CONFIG } from "./ticket.config.js";

/**
 * Build the WHERE clause used by ticket list and ticket export.
 *
 * parameterOffset allows callers that already have SQL parameters
 * to append ticket filters without parameter-number collisions.
 *
 * @param {object} filters
 * @param {number} parameterOffset
 *
 * @returns {{
 *   whereClause: string,
 *   values: Array<unknown>,
 *   nextParameterIndex: number
 * }}
 */
function buildTicketListWhereClause(filters = {}, parameterOffset = 0) {
  const conditions = [];
  const values = [];

  const addValue = (value) => {
    values.push(value);

    return `$${parameterOffset + values.length}`;
  };

  const addUuidValues = (items) =>
    items.map((item) => `${addValue(item)}::UUID`);

  /*
   * Global search covers ticket text fields and the display labels
   * of related records. Relationship IDs are intentionally not used
   * as substitutes for human-readable labels.
   *
   * This WHERE clause is shared by the list and count queries.
   */
  if (filters.search) {
    const parameter = addValue(filters.search);

    conditions.push(`
      (
        -- Core ticket fields
        t.ticket_number ILIKE '%' || ${parameter} || '%'
        OR t.subject ILIKE '%' || ${parameter} || '%'
        OR t.description ILIKE '%' || ${parameter} || '%'
        OR t.initial_diagnosis ILIKE '%' || ${parameter} || '%'
        OR t.solution ILIKE '%' || ${parameter} || '%'
        OR t.resolution ILIKE '%' || ${parameter} || '%'
        OR t.employee_id ILIKE '%' || ${parameter} || '%'
        OR t.employee_current_office_name_id ILIKE '%' || ${parameter} || '%'
        OR t.bill_reference_no ILIKE '%' || ${parameter} || '%'
        OR t.duplicate_ticket ILIKE '%' || ${parameter} || '%'
        OR t.letter_no ILIKE '%' || ${parameter} || '%'
        OR t.priority ILIKE '%' || ${parameter} || '%'

        -- Contact information
        OR contact.name ILIKE '%' || ${parameter} || '%'
        OR contact.mobile_phone ILIKE '%' || ${parameter} || '%'
        OR contact.email ILIKE '%' || ${parameter} || '%'
        OR district.name ILIKE '%' || ${parameter} || '%'

        -- User display names
        OR CONCAT_WS(' ', requester.first_name, requester.last_name)
          ILIKE '%' || ${parameter} || '%'
        OR CONCAT_WS(' ', creator.first_name, creator.last_name)
          ILIKE '%' || ${parameter} || '%'
        OR creator.username ILIKE '%' || ${parameter} || '%'
        OR creator.email ILIKE '%' || ${parameter} || '%'
        OR CONCAT_WS(' ', assignee.first_name, assignee.last_name)
          ILIKE '%' || ${parameter} || '%'

        -- Related master-data labels and codes
        OR ticket_status.name ILIKE '%' || ${parameter} || '%'
        OR ticket_status.code ILIKE '%' || ${parameter} || '%'
        OR organization.name ILIKE '%' || ${parameter} || '%'
        OR organization.code ILIKE '%' || ${parameter} || '%'
        OR department.name ILIKE '%' || ${parameter} || '%'
        OR department.code ILIKE '%' || ${parameter} || '%'
        OR service_type.name ILIKE '%' || ${parameter} || '%'
        OR service_type.code ILIKE '%' || ${parameter} || '%'
        OR ticket_category.name ILIKE '%' || ${parameter} || '%'
        OR ticket_category.code ILIKE '%' || ${parameter} || '%'
        OR problem_statement.name ILIKE '%' || ${parameter} || '%'
        OR problem_statement.code ILIKE '%' || ${parameter} || '%'
        OR current_bill_status.name ILIKE '%' || ${parameter} || '%'
        OR current_bill_status.code ILIKE '%' || ${parameter} || '%'
        OR ticket_severity.name ILIKE '%' || ${parameter} || '%'
        OR ticket_severity.code ILIKE '%' || ${parameter} || '%'
        OR issue_category.name ILIKE '%' || ${parameter} || '%'
        OR issue_category.code ILIKE '%' || ${parameter} || '%'
        OR dependency_category.name ILIKE '%' || ${parameter} || '%'
        OR dependency_category.code ILIKE '%' || ${parameter} || '%'
        OR caller_department.name ILIKE '%' || ${parameter} || '%'
      )
    `);
  }

  for (const definition of Object.values(TICKET_CONFIG.listFilterDefinitions)) {
    const value = filters[definition.queryKey];

    if (value === undefined || value === null || value === "") {
      continue;
    }

    switch (definition.type) {
      case "uuid": {
        if (definition.multi && Array.isArray(value)) {
          const parameters = addUuidValues(value);

          conditions.push(
            `t.${definition.column} IN (${parameters.join(", ")})`,
          );
        } else {
          const parameter = addValue(value);

          conditions.push(`t.${definition.column} = ${parameter}::UUID`);
        }

        break;
      }

      case "text": {
        const parameter = addValue(value);
        const expression = definition.sqlExpression ?? `t.${definition.column}`;

        if (definition.operator === "equals") {
          conditions.push(`${expression} = ${parameter}`);
        } else {
          conditions.push(`${expression} ILIKE '%' || ${parameter} || '%'`);
        }

        break;
      }

      case "date_from": {
        const parameter = addValue(value);

        conditions.push(`t.${definition.column} >= ${parameter}::DATE`);

        break;
      }

      case "date_to": {
        const parameter = addValue(value);

        conditions.push(
          `t.${definition.column} < (${parameter}::DATE + INTERVAL '1 day')`,
        );

        break;
      }

      default:
        throw new Error(
          `Unsupported ticket list filter type: ${definition.type}`,
        );
    }
  }

  /*
   * District is associated with the ticket's contact.
   * Use the existing contact join; district is not a column on tickets.
   */
  if (Array.isArray(filters.districtId) && filters.districtId.length > 0) {
    const districtParameters = addUuidValues([...new Set(filters.districtId)]);

    conditions.push(
      `contact.district_id IN (${districtParameters.join(", ")})`,
    );
  }

  /*
   * SLA filters. The ticket repository and export repository must both
   * expose the current ticket_sla row using the alias `ts`.
   */
  if (Array.isArray(filters.slaStatus) && filters.slaStatus.length > 0) {
    const requestedStatuses = [...new Set(filters.slaStatus)];
    const statusConditions = [];
    const regularStatuses = requestedStatuses.filter(
      (status) => status !== "NOT_TRACKED",
    );

    if (regularStatuses.length > 0) {
      const parameter = addValue(regularStatuses);

      statusConditions.push(`ts.status = ANY(${parameter}::TEXT[])`);
    }

    if (requestedStatuses.includes("NOT_TRACKED")) {
      statusConditions.push("(ts.id IS NULL OR ts.status = 'NOT_TRACKED')");
    }

    conditions.push(`(${statusConditions.join(" OR ")})`);
  }

  if (filters.slaRemainingHoursMin !== undefined) {
    const parameter = addValue(filters.slaRemainingHoursMin * 60);

    conditions.push(`ts.remaining_business_minutes >= ${parameter}::NUMERIC`);
  }

  if (filters.slaRemainingHoursMax !== undefined) {
    const parameter = addValue(filters.slaRemainingHoursMax * 60);

    conditions.push(`ts.remaining_business_minutes <= ${parameter}::NUMERIC`);
  }

  /*
   * DataGrid column filters.
   *
   * SQL expressions are selected exclusively from the trusted
   * TICKET_CONFIG allowlist. Request values are always parameterized.
   */
  const columnFilterModel = filters.columnFilters;

  if (columnFilterModel?.items?.length) {
    const columnConditions = [];

    for (const item of columnFilterModel.items) {
      const definition = TICKET_CONFIG.columnFilterDefinitions[item.field];

      // Defense in depth: the builder may be called without Zod validation.
      if (!definition) {
        throw new Error(
          `Unsupported ticket column filter field: ${item.field}`,
        );
      }

      const expression = `(${definition.sqlExpression})::TEXT`;
      const { operator, value } = item;

      switch (operator) {
        case "isEmpty": {
          columnConditions.push(`
            NULLIF(BTRIM(COALESCE(${expression}, '')), '') IS NULL
          `);
          break;
        }

        case "isNotEmpty": {
          columnConditions.push(`
            NULLIF(BTRIM(COALESCE(${expression}, '')), '') IS NOT NULL
          `);
          break;
        }

        case "isAnyOf": {
          if (!Array.isArray(value) || value.length === 0) {
            continue;
          }

          // Deduplicate values case-insensitively to avoid redundant binds.
          const uniqueValues = [
            ...new Map(
              value.map((entry) => [entry.toLocaleLowerCase("en-US"), entry]),
            ).values(),
          ];

          const parameters = uniqueValues.map((entry) => addValue(entry));

          columnConditions.push(`
            LOWER(${expression}) IN (
              ${parameters.map((parameter) => `LOWER(${parameter})`).join(", ")}
            )
          `);
          break;
        }

        case "contains":
        case "doesNotContain":
        case "startsWith":
        case "endsWith": {
          if (typeof value !== "string" || value.trim() === "") {
            continue;
          }

          // User-entered % and _ must be treated literally, not as
          // SQL LIKE wildcards. Backslashes must also be escaped.
          const escapedValue = value.replace(/[\\%_]/g, "\\$&");
          const parameter = addValue(escapedValue);

          switch (operator) {
            case "contains":
              columnConditions.push(`
                ${expression} ILIKE '%' || ${parameter} || '%'
                ESCAPE E'\\\\'
              `);
              break;

            case "doesNotContain":
              columnConditions.push(`
                ${expression} IS NOT NULL
                AND ${expression} NOT ILIKE '%' || ${parameter} || '%'
                ESCAPE E'\\\\'
              `);
              break;

            case "startsWith":
              columnConditions.push(`
                ${expression} ILIKE ${parameter} || '%'
                ESCAPE E'\\\\'
              `);
              break;

            case "endsWith":
              columnConditions.push(`
                ${expression} ILIKE '%' || ${parameter}
                ESCAPE E'\\\\'
              `);
              break;
          }

          break;
        }

        case "equals":
        case "doesNotEqual": {
          if (typeof value !== "string" || value.trim() === "") {
            continue;
          }

          const parameter = addValue(value);

          if (operator === "equals") {
            columnConditions.push(`
              LOWER(${expression}) = LOWER(${parameter})
            `);
          } else {
            // SQL NULL is not treated as a value that differs from
            // the requested value.
            columnConditions.push(`
              ${expression} IS NOT NULL
              AND LOWER(${expression}) <> LOWER(${parameter})
            `);
          }

          break;
        }

        default:
          throw new Error(
            `Unsupported ticket column filter operator: ${operator}`,
          );
      }
    }

    if (columnConditions.length > 0) {
      const logicOperator =
        columnFilterModel.logicOperator === "or" ? "OR" : "AND";

      conditions.push(`
        (${columnConditions.join(` ${logicOperator} `)})
      `);
    }
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join("\nAND ")}` : "",
    values,
    nextParameterIndex: parameterOffset + values.length + 1,
  };
}

export { buildTicketListWhereClause };

export default Object.freeze({
  buildTicketListWhereClause,
});
