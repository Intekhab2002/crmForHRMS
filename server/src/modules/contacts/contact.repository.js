import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const CONTACT_FIELDS = `
    c.id,
    c.organization_id,
    c.department_id,
    c.name,
    c.mobile_phone,
    c.email,
    c.district,
    c.created_at,
    c.updated_at
`;

const FIND_CONTACT_BY_MOBILE = `
    SELECT ${CONTACT_FIELDS}
    FROM contacts c
    WHERE
        c.organization_id = $1::UUID
        AND c.mobile_phone = $2::VARCHAR
    LIMIT 1;
`;

const FIND_CONTACT_BY_ID = `
    SELECT ${CONTACT_FIELDS}
    FROM contacts c
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
        district
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::VARCHAR
    )
    RETURNING ${CONTACT_FIELDS};
`;

const UPDATE_CONTACT = `
    UPDATE contacts
    SET
        department_id = COALESCE($2::UUID, department_id),
        name = COALESCE($3::VARCHAR, name),
        mobile_phone = COALESCE($4::VARCHAR, mobile_phone),
        email = COALESCE($5::VARCHAR, email),
        district = COALESCE($6::VARCHAR, district),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1::UUID
    RETURNING ${CONTACT_FIELDS};
`;

async function findContactByMobile(organizationId, mobile, tx = null) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        FIND_CONTACT_BY_MOBILE,
        [organizationId, mobile],
    );
    return result.rows[0] ?? null;
}

async function findContactById(id, tx = null) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(FIND_CONTACT_BY_ID, [id]);
    return result.rows[0] ?? null;
}

async function createContact(data, tx = null) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        CREATE_CONTACT,
        [
            randomUUID(),
            data.organizationId,
            data.departmentId ?? null,
            data.name,
            data.mobile,
            data.email ?? null,
            data.district ?? null,
        ],
    );
    return result.rows[0];
}

async function updateContact(id, data, tx = null) {
    const executor = getQueryExecutor(tx);
    const result = await executor.query(
        UPDATE_CONTACT,
        [
            id,
            data.departmentId ?? null,
            data.name ?? null,
            data.mobile ?? null,
            data.email ?? null,
            data.district ?? null,
        ],
    );
    return result.rows[0] ?? null;
}

export default Object.freeze({
    findContactByMobile,
    findContactById,
    createContact,
    updateContact,
});
