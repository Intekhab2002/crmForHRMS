import { getQueryExecutor } from "../../database/queryExecutor.js";

const FIND_BY_TICKET = `
    SELECT
        ta.id,
        ta.ticket_id,
        ta.user_id,
        u.username,
        u.email,
        ta.original_name,
        ta.stored_name,
        ta.mime_type,
        ta.file_size,
        ta.storage_path,
        ta.created_at,
        ta.updated_at
    FROM ticket_attachments ta
    INNER JOIN users u
        ON u.id = ta.user_id
    WHERE ta.ticket_id = $1::UUID
    ORDER BY ta.created_at DESC;
`;

const FIND_BY_ID = `
    SELECT
        ta.id,
        ta.ticket_id,
        ta.user_id,
        u.username,
        u.email,
        ta.original_name,
        ta.stored_name,
        ta.mime_type,
        ta.file_size,
        ta.storage_path,
        ta.created_at,
        ta.updated_at
    FROM ticket_attachments ta
    INNER JOIN users u
        ON u.id = ta.user_id
    WHERE ta.id = $1::UUID
    LIMIT 1;
`;

const CREATE = `
    INSERT INTO ticket_attachments (
        id,
        ticket_id,
        user_id,
        original_name,
        stored_name,
        mime_type,
        file_size,
        storage_path
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::BIGINT,
        $8::TEXT
    )
    RETURNING
        id,
        ticket_id,
        user_id,
        original_name,
        stored_name,
        mime_type,
        file_size,
        storage_path,
        created_at,
        updated_at;
`;

const DELETE = `
    DELETE FROM ticket_attachments
    WHERE id = $1::UUID
    RETURNING *;
`;

async function findByTicket(ticketId, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_BY_TICKET,
        [ticketId],
    );

    return result.rows;
}

async function findById(attachmentId, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_BY_ID,
        [attachmentId],
    );

    return result.rows[0] ?? null;
}

async function create(
    {
        id,
        ticketId,
        userId,
        originalName,
        storedName,
        mimeType,
        fileSize,
        storagePath,
    },
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE,
        [
            id,
            ticketId,
            userId,
            originalName,
            storedName,
            mimeType,
            fileSize,
            storagePath,
        ],
    );

    return result.rows[0];
}

async function remove(
    attachmentId,
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        DELETE,
        [attachmentId],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findByTicket,
    findById,
    create,
    remove,
});