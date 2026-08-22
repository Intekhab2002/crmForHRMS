import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const CONTACT_FIELDS = `
    c.id,
    c.organization_id,
    c.name,
    c.mobile_phone,
    c.created_at,
    c.updated_at
`;

const FIND_CONTACT_BY_MOBILE = `
    SELECT
        ${CONTACT_FIELDS}
    FROM contacts c
    WHERE
        c.organization_id = $1::UUID
        AND c.mobile_phone = $2::VARCHAR
    LIMIT 1;
`;

const CREATE_CONTACT = `
    INSERT INTO contacts (
        id,
        organization_id,
        name,
        mobile_phone
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::VARCHAR,
        $4::VARCHAR
    )
    RETURNING
        id,
        organization_id,
        name,
        mobile_phone,
        created_at,
        updated_at;
`;

async function findContactByMobile(
    organizationId,
    mobile,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_CONTACT_BY_MOBILE,
        [
            organizationId,
            mobile,
        ],
    );

    return result.rows[0] ?? null;
}

async function createContact(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_CONTACT,
        [
            randomUUID(),
            data.organizationId,
            data.name,
            data.mobile,
        ],
    );

    return result.rows[0];
}

export default Object.freeze({
    findContactByMobile,
    createContact,
});