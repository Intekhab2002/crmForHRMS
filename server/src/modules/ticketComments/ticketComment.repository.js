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
        u.email,
        u.first_name,
        u.last_name
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

const FIND_COMMENT_BY_ID = `
    SELECT
        tc.id,
        tc.ticket_id,
        tc.user_id,
        tc.comment,
        tc.created_at,
        tc.updated_at
    FROM ticket_comments tc
    WHERE tc.id = $1::UUID
      AND tc.ticket_id = $2::UUID;
`;

const UPDATE_COMMENT = `
    UPDATE ticket_comments
    SET
        comment = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2::UUID
      AND ticket_id = $3::UUID
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

async function findCommentById(
    commentId,
    ticketId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_COMMENT_BY_ID,
        [
            commentId,
            ticketId,
        ],
    );

    return result.rows[0] ?? null;
}

async function updateComment(
    commentId,
    ticketId,
    comment,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        UPDATE_COMMENT,
        [
            comment,
            commentId,
            ticketId,
        ],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    listComments,
    createComment,
        findCommentById,
    updateComment,
});