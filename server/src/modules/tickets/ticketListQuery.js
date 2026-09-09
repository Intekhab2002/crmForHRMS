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
   * Global search intentionally remains separate from
   * structured field filters.
   */
  if (filters.search) {
    const parameter = addValue(filters.search);

    conditions.push(`
      (
        t.ticket_number ILIKE '%' || ${parameter} || '%'
        OR t.subject ILIKE '%' || ${parameter} || '%'
        OR t.employee_id ILIKE '%' || ${parameter} || '%'
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

        if (definition.operator === "equals") {
          conditions.push(`t.${definition.column} = ${parameter}`);
        } else {
          conditions.push(
            `t.${definition.column} ILIKE '%' || ${parameter} || '%'`,
          );
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
