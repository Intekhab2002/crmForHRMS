import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

const PROBLEM_STATEMENT_FIELDS = `
    ps.id,
    ps.code,
    ps.name,
    ps.description,
    ps.is_active,
    ps.display_order,
    ps.created_at,
    ps.updated_at
`;

const PROBLEM_STATEMENT_RETURNING_FIELDS = `
    id,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
`;

const FIND_PROBLEM_STATEMENT = `
    SELECT
        ${PROBLEM_STATEMENT_FIELDS}
    FROM PROBLEM_STATEMENTS ps
    WHERE
        (
            $1::VARCHAR IS NULL
            OR ps.code ILIKE '%' || $1::VARCHAR || '%'
            OR ps.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR ps.is_active = $2::BOOLEAN
        )
    ORDER BY
        ps.display_order ASC,
        ps.name ASC
    LIMIT $3::INTEGER
    OFFSET $4::INTEGER;
`;

const COUNT_PROBLEM_STATEMENT = `
    SELECT COUNT(*)::INTEGER AS total
    FROM PROBLEM_STATEMENTS ps
    WHERE
        (
            $1::VARCHAR IS NULL
            OR ps.code ILIKE '%' || $1::VARCHAR || '%'
            OR ps.name ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::BOOLEAN IS NULL
            OR ps.is_active = $2::BOOLEAN
        );
`;

const FIND_PROBLEM_STATEMENT_BY_ID = `
    SELECT
        ${PROBLEM_STATEMENT_FIELDS}
    FROM PROBLEM_STATEMENTS ps
    WHERE ps.id = $1::UUID
    LIMIT 1;
`;

const FIND_PROBLEM_STATEMENT_BY_CODE = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM PROBLEM_STATEMENTS
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_PROBLEM_STATEMENT_BY_NAME = `
    SELECT
        id,
        code,
        name,
        is_active
    FROM PROBLEM_STATEMENTS
    WHERE LOWER(name) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const CREATE_PROBLEM_STATEMENT = `
    INSERT INTO PROBLEM_STATEMENTS (
        id,
        code,
        name,
        description,
        is_active,
        display_order
    )
    VALUES (
        $1::UUID,
        $2::VARCHAR,
        $3::VARCHAR,
        $4::TEXT,
        $5::BOOLEAN,
        $6::INTEGER
    )
    RETURNING
        ${PROBLEM_STATEMENT_RETURNING_FIELDS};
`;

const UPDATE_PROBLEM_STATEMENT = `
    UPDATE PROBLEM_STATEMENTS
    SET
        code = COALESCE($2::VARCHAR, code),
        name = COALESCE($3::VARCHAR, name),
        description = CASE
            WHEN $4::BOOLEAN THEN $5::TEXT
            ELSE description
        END,
        is_active = COALESCE($6::BOOLEAN, is_active),
        display_order = COALESCE(
            $7::INTEGER,
            display_order
        )
    WHERE id = $1::UUID
    RETURNING
        ${PROBLEM_STATEMENT_RETURNING_FIELDS};
`;

const DEACTIVATE_PROBLEM_STATEMENT = `
    UPDATE PROBLEM_STATEMENTS
    SET is_active = FALSE
    WHERE id = $1::UUID
    RETURNING
        ${PROBLEM_STATEMENT_RETURNING_FIELDS};
`;

async function findproblemStatement(filters, tx = null) {
    const executor = getQueryExecutor(tx);

    const values = [
        filters.search ?? null,
        filters.isActive ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(
            FIND_PROBLEM_STATEMENT,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),
        executor.query(
            COUNT_PROBLEM_STATEMENT,
            values,
        ),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(
            countResult.rows[0]?.total ?? 0,
        ),
    };
}

async function findProblemStatementById(
    problemStatementId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_PROBLEM_STATEMENT_BY_ID,
        [problemStatementId],
    );

    return result.rows[0] ?? null;
}

async function findProblemStatementByCode(
    code,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_PROBLEM_STATEMENT_BY_CODE,
        [code],
    );

    return result.rows[0] ?? null;
}

async function findProblemStatementByName(
    name,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_PROBLEM_STATEMENT_BY_NAME,
        [name],
    );

    return result.rows[0] ?? null;
}

async function createProblemStatement(
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_PROBLEM_STATEMENT,
        [
            randomUUID(),
            data.code,
            data.name,
            data.description ?? null,
            data.isActive ?? true,
            data.displayOrder ?? 0,
        ],
    );

    return result.rows[0];
}

async function updateProblemStatement(
    problemStatementId,
    data,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const hasDescription =
        Object.prototype.hasOwnProperty.call(
            data,
            "description",
        );

    const result = await executor.query(
        UPDATE_PROBLEM_STATEMENT,
        [
            problemStatementId,
            data.code ?? null,
            data.name ?? null,
            hasDescription,
            data.description ?? null,
            data.isActive ?? null,
            data.displayOrder ?? null,
        ],
    );

    return result.rows[0] ?? null;
}

async function deactivateProblemStatement(
    problemStatementId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DEACTIVATE_PROBLEM_STATEMENT,
        [problemStatementId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findproblemStatement,
    findProblemStatementById,
    findProblemStatementByCode,
    findProblemStatementByName,
    createProblemStatement,
    updateProblemStatement,
    deactivateProblemStatement,
});