import { getQueryExecutor } from "../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

export async function listAvailableDashboards() {
  const result = await ex().query(`
    SELECT DISTINCT p.code
    FROM permissions p
    WHERE p.code LIKE 'dashboard:%:read'
      AND p.is_active = TRUE
    ORDER BY p.code ASC
  `);

  return result.rows.map((row) => row.code);
}

export default Object.freeze({ listAvailableDashboards });
