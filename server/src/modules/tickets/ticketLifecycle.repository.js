import { getQueryExecutor } from "../../database/queryExecutor.js";

const CREATE = `
    INSERT INTO ticket_lifecycle_events (
        id,
        ticket_id,
        actor_user_id,
        event_type,
        event_action,
        field_name,
        old_value,
        new_value,
        metadata
    )
    VALUES (
        $1::UUID,
        $2::UUID,
        $3::UUID,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::TEXT,
        $8::TEXT,
        $9::JSONB
    )
    RETURNING
        id,
        ticket_id,
        actor_user_id,
        event_type,
        event_action,
        field_name,
        old_value,
        new_value,
        metadata,
        created_at;
`;

const FIND_BY_TICKET = `
    SELECT
        tle.id,
        tle.ticket_id,
        tle.actor_user_id,
        u.username,
        u.email,
        tle.event_type,
        tle.event_action,
        tle.field_name,
        tle.old_value,
        tle.new_value,
        tle.metadata,
        tle.created_at
    FROM ticket_lifecycle_events tle
    INNER JOIN users u
        ON u.id = tle.actor_user_id
    WHERE tle.ticket_id = $1::UUID
    ORDER BY tle.created_at DESC, tle.id DESC;
`;

async function create(
    {
        id,
        ticketId,
        actorUserId,
        eventType,
        eventAction,
        fieldName = null,
        oldValue = null,
        newValue = null,
        metadata = {},
    },
    tx = null,
) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        CREATE,
        [
            id,
            ticketId,
            actorUserId,
            eventType,
            eventAction,
            fieldName,
            oldValue,
            newValue,
            JSON.stringify(metadata),
        ],
    );

    return result.rows[0];
}

async function findByTicket(ticketId, tx = null) {
    const executor = getQueryExecutor(tx);

    const result = await executor.query(
        FIND_BY_TICKET,
        [ticketId],
    );

    return result.rows;
}

export default Object.freeze({
    create,
    findByTicket,
});