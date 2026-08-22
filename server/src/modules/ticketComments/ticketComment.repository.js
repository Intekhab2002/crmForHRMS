import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";

const LIST_COMMENTS = `
    SELECT
        tc.id,
        tc.ticket_id,
        tc.user_id,
        tc.comment,
        tc.created_at,
        tc.updated_at,
        u.username,
        u.email
    FROM ticket_comments tc
    INNER JOIN users u
        ON u.id = tc.user_id
    WHERE tc.ticket_id = $1::UUID
    ORDER BY tc.created_at ASC, tc.id ASC;
`;

const CREATE_COMMENT = `
    INSERT INTO ticket_comments (
        id,
        ticket_id,
        user_id,
        comment
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4
    )
    RETURNING
        id,
        ticket_id,
        user_id,
        comment,
        created_at,
        updated_at;
`;

async function listComments(ticketId, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        LIST_COMMENTS,
        [ticketId],
    );

    return result.rows;
}

async function createComment(
    ticketId,
    userId,
    comment,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE_COMMENT,
        [
            randomUUID(),
            ticketId,
            userId,
            comment,
        ],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    listComments,
    createComment,
});