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
WHERE
        c.organization_id = $1::UUID
        AND c.mobile_phone = $2::VARCHAR
    LIMIT 1;
`;

const FIND_CONTACT_BY_ID = `
    SELECT ${CONTACT_SELECT_FIELDS}
    FROM contacts c
LEFT JOIN districts d
    ON d.id = c.district_id
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

function normalizeMobile(mobilePhone) {
  return String(mobilePhone ?? "").trim();
}

function mapContactRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    departmentId: row.department_id,
    name: row.name,
    mobilePhone: row.mobile_phone,
    email: row.email,
    district: row.district_id
      ? {
          id: row.district_id,
          code: row.district_code,
          name: row.district_name,
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
    data.mobilePhone,
    tx,
  );

  if (existing) {
    return updateContact(existing.id, data, tx);
  }

  return createContact(data, tx);
}

export default Object.freeze({
  findContactByMobile,
  findContactById,
  createContact,
  updateContact,
  findOrCreateContact,
});
