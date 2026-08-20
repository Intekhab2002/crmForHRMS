import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const ORGANIZATION_FIELDS = `
    o.id,
    o.code,
    o.name,
    o.description,
    o.email,
    o.phone,
    o.website,
    o.address_line1,
    o.address_line2,
    o.city,
    o.state,
    o.postal_code,
    o.country,
    o.status,
    o.created_at,
    o.updated_at
`;

const ORGANIZATION_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    email,
    phone,
    website,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    status,
    created_at,
    updated_at
`;

const FIND_ORGANIZATIONS = `
    SELECT
        ${ORGANIZATION_FIELDS}
    FROM organizations o
    WHERE
        (
            $1::VARCHAR IS NULL
            OR o.code ILIKE '%' || $1::VARCHAR || '%'
            OR o.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::VARCHAR IS NULL
            OR o.status = $2::VARCHAR
        )
    ORDER BY o.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_ORGANIZATIONS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM organizations o
    WHERE
        (
            $1::VARCHAR IS NULL
            OR o.code ILIKE '%' || $1::VARCHAR || '%'
            OR o.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::VARCHAR IS NULL
            OR o.status = $2::VARCHAR
        );
`;

const FIND_ORGANIZATION_BY_ID = `
    SELECT
        ${ORGANIZATION_FIELDS}
    FROM organizations o
    WHERE o.id = $1::UUID
    LIMIT 1;
`;

const FIND_ORGANIZATION_BY_CODE = `
    SELECT
        id,
        code,
        name,
        status
    FROM organizations
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_ORGANIZATION_BY_NAME = `
    SELECT
        id,
        code,
        name,
        status
    FROM organizations
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_ORGANIZATION = `
    INSERT INTO organizations (
        id,
        code,
        name,
        description,
        email,
        phone,
        website,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
    )
    VALUES (
        $1::UUID,
        $2::VARCHAR,
        $3::VARCHAR,
        $4::TEXT,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::VARCHAR,
        $8::VARCHAR,
        $9::VARCHAR,
        $10::VARCHAR,
        $11::VARCHAR,
        $12::VARCHAR,
        $13::VARCHAR
    )
    RETURNING
        ${ORGANIZATION_RETURNING_FIELDS};
`;

const UPDATE_ORGANIZATION = `
    UPDATE organizations
    SET
        name = COALESCE($2::VARCHAR, name),
        description = CASE
            WHEN $3::BOOLEAN THEN $4::TEXT
            ELSE description
        END,
        email = CASE
            WHEN $5::BOOLEAN THEN $6::VARCHAR
            ELSE email
        END,
        phone = CASE
            WHEN $7::BOOLEAN THEN $8::VARCHAR
            ELSE phone
        END,
        website = CASE
            WHEN $9::BOOLEAN THEN $10::VARCHAR
            ELSE website
        END,
        address_line1 = CASE
            WHEN $11::BOOLEAN THEN $12::VARCHAR
            ELSE address_line1
        END,
        address_line2 = CASE
            WHEN $13::BOOLEAN THEN $14::VARCHAR
            ELSE address_line2
        END,
        city = CASE
            WHEN $15::BOOLEAN THEN $16::VARCHAR
            ELSE city
        END,
        state = CASE
            WHEN $17::BOOLEAN THEN $18::VARCHAR
            ELSE state
        END,
        postal_code = CASE
            WHEN $19::BOOLEAN THEN $20::VARCHAR
            ELSE postal_code
        END,
        country = CASE
            WHEN $21::BOOLEAN THEN $22::VARCHAR
            ELSE country
        END,
        status = COALESCE($23::VARCHAR, status)
    WHERE id = $1::UUID
    RETURNING
        ${ORGANIZATION_RETURNING_FIELDS};
`;

const DEACTIVATE_ORGANIZATION = `
    UPDATE organizations
    SET status = 'inactive'
    WHERE id = $1::UUID
    RETURNING
        ${ORGANIZATION_RETURNING_FIELDS};
`;

const COUNT_ORGANIZATION_DEPARTMENTS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM departments
    WHERE organization_id = $1::UUID;
`;

async function findOrganizations(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.status ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(FIND_ORGANIZATIONS, [
            ...values,
            filters.limit,
            filters.offset,
        ]),
        executor.query(COUNT_ORGANIZATIONS, values),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(countResult.rows[0]?.total ?? 0),
    };
}

async function findOrganizationById(id, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_ORGANIZATION_BY_ID,
        [id],
    );

    return result.rows[0] ?? null;
}

async function findOrganizationByCode(code, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_ORGANIZATION_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findOrganizationByName(name, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_ORGANIZATION_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createOrganization(data, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_ORGANIZATION,
        [
            randomUUID(),
            data.code,
            data.name,
            data.description ?? null,
            data.email ?? null,
            data.phone ?? null,
            data.website ?? null,
            data.addressLine1 ?? null,
            data.addressLine2 ?? null,
            data.city ?? null,
            data.state ?? null,
            data.postalCode ?? null,
            data.country ?? null,
        ],
    );

    return result.rows[0];
}

async function updateOrganization(
    organizationId,
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const has = (key) =>
        Object.prototype.hasOwnProperty.call(data, key);

    const result = await executor.query(
        UPDATE_ORGANIZATION,
        [
            organizationId,
            data.name ?? null,

            has("description"),
            data.description ?? null,

            has("email"),
            data.email ?? null,

            has("phone"),
            data.phone ?? null,

            has("website"),
            data.website ?? null,

            has("addressLine1"),
            data.addressLine1 ?? null,

            has("addressLine2"),
            data.addressLine2 ?? null,

            has("city"),
            data.city ?? null,

            has("state"),
            data.state ?? null,

            has("postalCode"),
            data.postalCode ?? null,

            has("country"),
            data.country ?? null,

            data.status ?? null,
        ],
    );

    return result.rows[0] ?? null;
}

async function countDepartments(
    organizationId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        COUNT_ORGANIZATION_DEPARTMENTS,
        [organizationId],
    );

    return Number(result.rows[0]?.total ?? 0);
}

async function deactivateOrganization(
    organizationId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_ORGANIZATION,
        [organizationId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findOrganizations,
    findOrganizationById,
    findOrganizationByCode,
    findOrganizationByName,
    createOrganization,
    updateOrganization,
    countDepartments,
    deactivateOrganization,
});