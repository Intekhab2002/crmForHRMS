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
    WITH lifecycle_events AS (
        SELECT
            tle.id,
            tle.ticket_id,
            tle.actor_user_id,
            u.username,
            u.email,
            u.first_name,
            u.last_name,
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
    ),

    lookup_values AS (
        SELECT
            'status'::TEXT AS field_name,
            ts.id::TEXT AS value_id,
            ts.name::TEXT AS display_value
        FROM ticket_statuses ts

        UNION ALL

        SELECT
            'assigned_to'::TEXT AS field_name,
            u.id::TEXT AS value_id,
            COALESCE(
                NULLIF(
                    TRIM(CONCAT_WS(' ', u.first_name, u.last_name)),
                    ''
                ),
                u.username,
                u.email
            )::TEXT AS display_value
        FROM users u

        UNION ALL

        SELECT
            'service_type'::TEXT AS field_name,
            st.id::TEXT AS value_id,
            st.name::TEXT AS display_value
        FROM service_types st

        UNION ALL

        SELECT
            'category'::TEXT AS field_name,
            tc.id::TEXT AS value_id,
            tc.name::TEXT AS display_value
        FROM ticket_categories tc

        UNION ALL

        SELECT
            'problem_statement'::TEXT AS field_name,
            ps.id::TEXT AS value_id,
            ps.name::TEXT AS display_value
        FROM problem_statements ps

        UNION ALL

        SELECT
            'current_bill_status'::TEXT AS field_name,
            cbs.id::TEXT AS value_id,
            cbs.name::TEXT AS display_value
        FROM current_bill_statuses cbs

        UNION ALL

        SELECT
            'severity'::TEXT AS field_name,
            ts.id::TEXT AS value_id,
            ts.name::TEXT AS display_value
        FROM ticket_severities ts

        UNION ALL

        SELECT
            'issue_category'::TEXT AS field_name,
            tic.id::TEXT AS value_id,
            tic.name::TEXT AS display_value
        FROM ticket_issue_categories tic

        UNION ALL

        SELECT
            'dependency_category'::TEXT AS field_name,
            tdc.id::TEXT AS value_id,
            tdc.name::TEXT AS display_value
        FROM ticket_dependency_categories tdc

        UNION ALL

        SELECT
            'department'::TEXT AS field_name,
            d.id::TEXT AS value_id,
            d.name::TEXT AS display_value
        FROM departments d

        UNION ALL

        SELECT
            'organization'::TEXT AS field_name,
            o.id::TEXT AS value_id,
            o.name::TEXT AS display_value
        FROM organizations o

        UNION ALL

        SELECT
            'requester_user_id'::TEXT AS field_name,
            u.id::TEXT AS value_id,
            COALESCE(
                NULLIF(
                    TRIM(CONCAT_WS(' ', u.first_name, u.last_name)),
                    ''
                ),
                u.username,
                u.email
            )::TEXT AS display_value
        FROM users u

        UNION ALL

        SELECT
            'contact'::TEXT AS field_name,
            c.id::TEXT AS value_id,
            c.name::TEXT AS display_value
        FROM contacts c

        UNION ALL

        SELECT
            'district'::TEXT AS field_name,
            d.id::TEXT AS value_id,
            d.name::TEXT AS display_value
        FROM districts d
    )

    SELECT
        le.id,
        le.ticket_id,
        le.actor_user_id,

        le.username,
        le.email,
        le.first_name,
        le.last_name,

        le.event_type,
        le.event_action,
        le.field_name,

        le.old_value,
        old_lookup.display_value AS old_display_value,

        le.new_value,
        new_lookup.display_value AS new_display_value,

        le.metadata,
        le.created_at

    FROM lifecycle_events le

    LEFT JOIN lookup_values old_lookup
        ON old_lookup.field_name = le.field_name
        AND old_lookup.value_id = le.old_value

    LEFT JOIN lookup_values new_lookup
        ON new_lookup.field_name = le.field_name
        AND new_lookup.value_id = le.new_value

    ORDER BY le.created_at DESC, le.id DESC;
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

  const result = await executor.query(CREATE, [
    id,
    ticketId,
    actorUserId,
    eventType,
    eventAction,
    fieldName,
    oldValue,
    newValue,
    JSON.stringify(metadata),
  ]);

  return result.rows[0];
}

async function findByTicket(ticketId, tx = null) {
  const executor = getQueryExecutor(tx);

  const result = await executor.query(FIND_BY_TICKET, [ticketId]);

  return result.rows;
}

export default Object.freeze({
  create,
  findByTicket,
});
