import db from "../../database/db.js";

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
    WHERE ta.ticket_id = $1
    ORDER BY ta.created_at DESC
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
    WHERE ta.id = $1
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
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
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
        updated_at
`;

const DELETE = `
    DELETE FROM ticket_attachments
    WHERE id = $1
    RETURNING *
`;

async function findByTicket(ticketId) {
    const result = await db.query(
        FIND_BY_TICKET,
        [ticketId],
    );

    return result.rows;
}

async function findById(attachmentId) {
    const result = await db.query(
        FIND_BY_ID,
        [attachmentId],
    );

    return result.rows[0] ?? null;
}

async function create({
    id,
    ticketId,
    userId,
    originalName,
    storedName,
    mimeType,
    fileSize,
    storagePath,
}) {
    const result = await db.query(CREATE, [
        id,
        ticketId,
        userId,
        originalName,
        storedName,
        mimeType,
        fileSize,
        storagePath,
    ]);

    return result.rows[0];
}

async function remove(attachmentId) {
    const result = await db.query(
        DELETE,
        [attachmentId],
    );

    return result.rows[0] ?? null;
}

export default {
    findByTicket,
    findById,
    create,
    remove,
};