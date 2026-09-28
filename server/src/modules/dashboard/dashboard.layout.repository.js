import { getQueryExecutor } from "../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

export async function findByUserAndType(userId, dashboardType, tx = null) {
  const result = await ex(tx).query(
    `
      SELECT id, user_id, dashboard_type, layout_version, layout_json,
             created_at, updated_at
      FROM user_dashboard_layouts
      WHERE user_id = $1::uuid
        AND dashboard_type = $2
      LIMIT 1
    `,
    [userId, dashboardType],
  );

  return result.rows[0] || null;
}

export async function upsert({
  userId,
  dashboardType,
  layoutVersion,
  layoutJson,
}, tx = null) {
  const result = await ex(tx).query(
    `
      INSERT INTO user_dashboard_layouts (
        user_id,
        dashboard_type,
        layout_version,
        layout_json
      )
      VALUES ($1::uuid, $2, $3, $4::jsonb)
      ON CONFLICT (user_id, dashboard_type)
      DO UPDATE SET
        layout_version = EXCLUDED.layout_version,
        layout_json = EXCLUDED.layout_json,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, dashboard_type, layout_version,
                layout_json, created_at, updated_at
    `,
    [
      userId,
      dashboardType,
      layoutVersion,
      JSON.stringify(layoutJson),
    ],
  );

  return result.rows[0];
}

export async function remove(userId, dashboardType, tx = null) {
  await ex(tx).query(
    `
      DELETE FROM user_dashboard_layouts
      WHERE user_id = $1::uuid
        AND dashboard_type = $2
    `,
    [userId, dashboardType],
  );
}

export default Object.freeze({ findByUserAndType, upsert, remove });
