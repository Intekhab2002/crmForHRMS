import { getQueryExecutor } from "../../database/queryExecutor.js";

const ex = (tx) => getQueryExecutor(tx);

export async function findDefinition(code, tx = null) {
  const result = await ex(tx).query(
    `SELECT * FROM report_definitions WHERE code=$1 AND is_active=TRUE ORDER BY created_at DESC LIMIT 1`,
    [code],
  );
  return result.rows[0] || null;
}

export async function listDefinitions(tx = null) {
  const result = await ex(tx).query(
    `SELECT * FROM report_definitions WHERE is_active=TRUE ORDER BY report_type, name`,
  );
  return result.rows;
}

export async function nextReportNumber(tx = null) {
  const result = await ex(tx).query(`SELECT nextval('report_number_seq')::bigint AS value`);
  return Number(result.rows[0].value);
}

export async function createRun(data, tx = null) {
  const result = await ex(tx).query(
    `
      INSERT INTO report_runs (
        report_id, report_definition_id, report_code, report_version,
        calculation_version, period_start, period_end, data_cutoff,
        timezone, filters, parameters, status, requested_by_user_id
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,'QUEUED',$12
      )
      RETURNING *
    `,
    [
      data.reportId,
      data.definitionId,
      data.reportCode,
      data.reportVersion,
      data.calculationVersion,
      data.periodStart,
      data.periodEnd,
      data.dataCutoff,
      data.timezone,
      JSON.stringify(data.filters || {}),
      JSON.stringify(data.parameters || {}),
      data.requestedByUserId || null,
    ],
  );
  return result.rows[0];
}

export async function getRun(id, tx = null) {
  const result = await ex(tx).query(
    `SELECT * FROM report_runs WHERE id=$1 LIMIT 1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function getRunWithArtifacts(id, tx = null) {
  const result = await ex(tx).query(
    `
      SELECT
        r.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', a.id,
              'artifactType', a.artifact_type,
              'fileName', a.file_name,
              'mimeType', a.mime_type,
              'storageKey', a.storage_key,
              'fileSizeBytes', a.file_size_bytes,
              'sha256', a.sha256,
              'createdAt', a.created_at
            )
            ORDER BY a.created_at
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'::jsonb
        ) AS artifacts
      FROM report_runs r
      LEFT JOIN report_artifacts a ON a.report_run_id=r.id
      WHERE r.id=$1
      GROUP BY r.id
    `,
    [id],
  );
  return result.rows[0] || null;
}

export async function listRuns({ page, limit, reportCode, status }, tx = null) {
  const where = [];
  const params = [];
  let index = 1;

  if (reportCode) {
    where.push(`r.report_code=$${index++}`);
    params.push(reportCode);
  }

  if (status) {
    where.push(`r.status=$${index++}`);
    params.push(status);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await ex(tx).query(
    `SELECT COUNT(*)::bigint AS total FROM report_runs r ${clause}`,
    params,
  );

  params.push(limit, (page - 1) * limit);

  const rowsResult = await ex(tx).query(
    `
      SELECT
        r.id,
        r.report_id,
        r.report_code,
        r.report_version,
        r.calculation_version,
        r.period_start,
        r.period_end,
        r.data_cutoff,
        r.timezone,
        r.status,
        r.record_count,
        r.started_at,
        r.completed_at,
        r.failed_at,
        r.created_at,
        COUNT(a.id)::integer AS artifact_count
      FROM report_runs r
      LEFT JOIN report_artifacts a ON a.report_run_id=r.id
      ${clause}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `,
    params,
  );

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.total || 0),
  };
}

export async function listQueuedRunIds(limit = 5, tx = null) {
  const result = await ex(tx).query(
    `SELECT id FROM report_runs WHERE status='QUEUED' ORDER BY created_at LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => row.id);
}

export async function claimRun(id, tx = null) {
  const result = await ex(tx).query(
    `
      UPDATE report_runs
      SET status='PROCESSING', started_at=CURRENT_TIMESTAMP
      WHERE id=$1 AND status='QUEUED'
      RETURNING *
    `,
    [id],
  );
  return result.rows[0] || null;
}

export async function completeRun(id, { recordCount, generatedByUserId }, tx = null) {
  const result = await ex(tx).query(
    `
      UPDATE report_runs
      SET status='COMPLETED',
          record_count=$2,
          generated_by_user_id=$3,
          completed_at=CURRENT_TIMESTAMP,
          error_code=NULL,
          error_message=NULL
      WHERE id=$1 AND status='PROCESSING'
      RETURNING *
    `,
    [id, recordCount, generatedByUserId || null],
  );
  return result.rows[0] || null;
}

export async function failRun(id, { errorCode, errorMessage }, tx = null) {
  const result = await ex(tx).query(
    `
      UPDATE report_runs
      SET status='FAILED',
          failed_at=CURRENT_TIMESTAMP,
          error_code=$2,
          error_message=$3
      WHERE id=$1 AND status='PROCESSING'
      RETURNING *
    `,
    [id, errorCode, errorMessage],
  );
  return result.rows[0] || null;
}

export async function createArtifact(data, tx = null) {
  const result = await ex(tx).query(
    `
      INSERT INTO report_artifacts (
        report_run_id, artifact_type, file_name, mime_type,
        storage_key, file_size_bytes, sha256
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      data.reportRunId,
      data.artifactType,
      data.fileName,
      data.mimeType,
      data.storageKey,
      data.fileSizeBytes,
      data.sha256,
    ],
  );
  return result.rows[0];
}

export async function deleteArtifact(id, tx = null) {
  await ex(tx).query(`DELETE FROM report_artifacts WHERE id=$1`, [id]);
}

export async function findArtifact(runId, artifactType, tx = null) {
  const result = await ex(tx).query(
    `
      SELECT a.*
      FROM report_artifacts a
      JOIN report_runs r ON r.id = a.report_run_id
      WHERE a.report_run_id=$1
        AND a.artifact_type=$2
        AND r.status='COMPLETED'
      LIMIT 1
    `,
    [runId, artifactType],
  );
  return result.rows[0] || null;
}

export default Object.freeze({
  findDefinition,
  listDefinitions,
  nextReportNumber,
  createRun,
  getRun,
  getRunWithArtifacts,
  listRuns,
  listQueuedRunIds,
  claimRun,
  completeRun,
  failRun,
  createArtifact,
  deleteArtifact,
  findArtifact,
});
