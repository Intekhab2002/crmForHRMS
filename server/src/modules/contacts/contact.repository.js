import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";

const CONTACT_SELECT_FIELDS = `
    c.id,
    c.organization_id,
    c.department_id,
    c.name,
    c.mobile_phone,
    c.email,
    d.id AS district_id,
    c.is_active,
    department.name AS department_name,
    d.code AS district_code,
    d.name AS district_name,
    c.created_at,
    c.updated_at
`;

const CONTACT_RETURNING_FIELDS = `
    id,
    organization_id,
    department_id,
    name,
    mobile_phone,
    email,
    district_id,
    created_at,
    updated_at
`;

const FIND_CONTACT_BY_MOBILE = `
    SELECT ${CONTACT_SELECT_FIELDS}
    FROM contacts c
    LEFT JOIN districts d
        ON d.id = c.district_id
    LEFT JOIN organizations organization
        ON organization.id = c.organization_id
    LEFT JOIN departments department
        ON department.id = c.department_id
    WHERE c.organization_id = $1::UUID
      AND c.mobile_phone = $2::VARCHAR
    LIMIT 1;
`;

const FIND_CONTACT_BY_ID = `
    SELECT ${CONTACT_SELECT_FIELDS}
    FROM contacts c
    LEFT JOIN districts d
        ON d.id = c.district_id
    LEFT JOIN organizations organization
        ON organization.id = c.organization_id
    LEFT JOIN departments department
        ON department.id = c.department_id
    WHERE c.id = $1::UUID
    LIMIT 1;
`;

const CREATE_CONTACT = `
    INSERT INTO contacts (
        id,
        organization_id,
        department_id,
        name,
        mobile_phone,
        email,
        district_id
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::UUID
    )
    RETURNING ${CONTACT_RETURNING_FIELDS};
`;

const UPDATE_CONTACT = `
    UPDATE contacts
    SET
        department_id = COALESCE($2::UUID, department_id),
        name = COALESCE($3::VARCHAR, name),
        mobile_phone = COALESCE($4::VARCHAR, mobile_phone),
        email = COALESCE($5::VARCHAR, email),
        district_id = COALESCE($6::UUID, district_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1::UUID
    RETURNING ${CONTACT_RETURNING_FIELDS};
`;

const FIND_ACTIVE_DISTRICT_BY_ID = `
    SELECT
        id,
        code,
        name
    FROM districts
    WHERE
        id = $1::UUID
        AND is_active = TRUE
    LIMIT 1;
`;

function normalizeMobile(mobilePhone) {
  return String(mobilePhone ?? "").trim();
}

function mapContactRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name ?? null,
    departmentId: row.department_id,
    departmentName: row.department_name ?? null,
    name: row.name,
    mobilePhone: row.mobile_phone,
    email: row.email,
    isActive: row.is_active,
    district: row.district_id
      ? {
          id: row.district_id,
          code: row.district_code ?? null,
          name: row.district_name ?? null,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findContactByMobile(organizationId, mobile, tx = null) {
  const executor = getQueryExecutor(tx);
  const normalizedMobile = normalizeMobile(mobile);
  const result = await executor.query(FIND_CONTACT_BY_MOBILE, [
    organizationId,
    normalizedMobile,
  ]);
  return mapContactRow(result.rows[0]);
}

async function findContactById(id, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(FIND_CONTACT_BY_ID, [id]);
  return mapContactRow(result.rows[0]);
}

async function createContact(data, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(CREATE_CONTACT, [
    randomUUID(),
    data.organizationId,
    data.departmentId ?? null,
    data.name,
    data.mobile,
    data.email ?? null,
    data.district ?? null,
  ]);
  return findContactById(result.rows[0].id, tx);
}

async function updateContact(id, data, tx = null) {
  const executor = getQueryExecutor(tx);
  const result = await executor.query(UPDATE_CONTACT, [
    id,
    data.departmentId ?? null,
    data.name ?? null,
    data.mobile ?? null,
    data.email ?? null,
    data.district ?? null,
  ]);
  return findContactById(id, tx);
}

async function findOrCreateContact(data, tx = null) {
  const existing = await findContactByMobile(
    data.organizationId,
    data.mobile,
    tx,
  );

  if (existing) {
    return updateContact(existing.id, data, tx);
  }

  return createContact(data, tx);
}

async function findActiveDistrictById(districtId, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(FIND_ACTIVE_DISTRICT_BY_ID, [districtId]);

  return result.rows[0] ?? null;
}

async function findContacts(filters, tx = null) {
  const executor = getQueryExecutor(tx);

  const values = [
    filters.search ?? null,
    filters.organizationId ?? null,
    filters.departmentId ?? null,
    filters.districtId ?? null,
    filters.isActive ?? true,
  ];

  const where = `
    WHERE c.is_active = $5::BOOLEAN
      AND ($1::VARCHAR IS NULL OR (
        c.name ILIKE '%' || $1::VARCHAR || '%'
        OR c.mobile_phone ILIKE '%' || $1::VARCHAR || '%'
        OR COALESCE(c.email, '') ILIKE '%' || $1::VARCHAR || '%'
        OR COALESCE(organization.name, '') ILIKE '%' || $1::VARCHAR || '%'
        OR COALESCE(department.name, '') ILIKE '%' || $1::VARCHAR || '%'
        OR COALESCE(d.name, '') ILIKE '%' || $1::VARCHAR || '%'
      ))
      AND ($2::UUID IS NULL OR c.organization_id = $2::UUID)
      AND ($3::UUID IS NULL OR c.department_id = $3::UUID)
      AND ($4::UUID IS NULL OR c.district_id = $4::UUID)
  `;

  const from = `
    FROM contacts c
    LEFT JOIN organizations organization
      ON organization.id = c.organization_id
    LEFT JOIN departments department
      ON department.id = c.department_id
    LEFT JOIN districts d
      ON d.id = c.district_id
  `;

  const [rowsResult, countResult] = await Promise.all([
    executor.query(
      `
        SELECT
          ${CONTACT_SELECT_FIELDS},
          (
            SELECT COUNT(*)::INTEGER
            FROM tickets t
            WHERE t.contact_id = c.id
          ) AS ticket_count
        ${from}
        ${where}
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $6::INTEGER OFFSET $7::INTEGER;
      `,
      [...values, filters.limit, filters.offset],
    ),
    executor.query(
      `SELECT COUNT(*)::INTEGER AS total ${from} ${where};`,
      values,
    ),
  ]);

  return {
    rows: rowsResult.rows.map((row) => ({
      ...mapContactRow(row),
      ticketCount: Number(row.ticket_count ?? 0),
    })),
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

async function findActiveContactById(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
      SELECT id
      FROM contacts
      WHERE id = $1::UUID
        AND is_active = TRUE
      LIMIT 1;
    `,
    [id],
  );

  if (!result.rows[0]) return null;
  return findContactById(id, tx);
}

async function findContactByMobileIncludingInactive(
  organizationId,
  mobile,
  tx = null,
) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
      SELECT id, is_active
      FROM contacts
      WHERE organization_id = $1::UUID
        AND mobile_phone = $2::VARCHAR
      LIMIT 1;
    `,
    [organizationId, normalizeMobile(mobile)],
  );

  return result.rows[0] ?? null;
}

async function findActiveOrganizationById(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
      SELECT id
      FROM organizations
      WHERE id = $1::UUID
        AND status = 'active'
      LIMIT 1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function findActiveDepartmentById(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
      SELECT id
      FROM departments
      WHERE id = $1::UUID
        AND is_active = TRUE
      LIMIT 1;
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

async function updateManagedContact(id, data, tx = null) {
  const executor = getQueryExecutor(tx);

  const has = (key) => Object.prototype.hasOwnProperty.call(data, key);

  const result = await executor.query(
    `
      UPDATE contacts
      SET
        organization_id = CASE WHEN $2::BOOLEAN
          THEN $3::UUID ELSE organization_id END,
        department_id = CASE WHEN $4::BOOLEAN
          THEN $5::UUID ELSE department_id END,
        district_id = CASE WHEN $6::BOOLEAN
          THEN $7::UUID ELSE district_id END,
        name = CASE WHEN $8::BOOLEAN
          THEN $9::VARCHAR ELSE name END,
        mobile_phone = CASE WHEN $10::BOOLEAN
          THEN $11::VARCHAR ELSE mobile_phone END,
        email = CASE WHEN $12::BOOLEAN
          THEN $13::VARCHAR ELSE email END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::UUID
        AND is_active = TRUE
      RETURNING id;
    `,
    [
      id,
      has("organizationId"),
      data.organizationId ?? null,
      has("departmentId"),
      data.departmentId ?? null,
      has("districtId"),
      data.districtId ?? null,
      has("name"),
      data.name ?? null,
      has("mobilePhone"),
      data.mobilePhone ?? null,
      has("email"),
      data.email ?? null,
    ],
  );

  return result.rows[0] ? findContactById(id, tx) : null;
}

async function deactivateContact(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
      UPDATE contacts
      SET is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::UUID
        AND is_active = TRUE
      RETURNING id;
    `,
    [id],
  );

  return result.rows[0] ? findContactById(id, tx) : null;
}

async function reactivateContact(id, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(
    `
      UPDATE contacts
      SET
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::UUID
        AND is_active = FALSE
      RETURNING id;
    `,
    [id],
  );

  return result.rows[0]
    ? findContactById(id, tx)
    : null;
}

export default Object.freeze({
  findContactByMobile,
  findContactById,
  createContact,
  updateContact,
  findOrCreateContact,
  findActiveDistrictById,

  findContacts,
  findActiveContactById,
  findContactByMobileIncludingInactive,
  findActiveOrganizationById,
  findActiveDepartmentById,
  updateManagedContact,
  deactivateContact,
  reactivateContact,
});
