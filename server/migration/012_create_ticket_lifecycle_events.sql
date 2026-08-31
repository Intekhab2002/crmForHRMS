-- ============================================================================
-- Migration: 012_create_ticket_lifecycle_events
-- Purpose  : Audit log of every meaningful state change on a ticket.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_lifecycle_events (
    id            UUID         PRIMARY KEY,
    ticket_id     UUID         NOT NULL,
    actor_user_id UUID         NOT NULL,
    event_type    VARCHAR(50)  NOT NULL,
    event_action  VARCHAR(100) NOT NULL,
    field_name    VARCHAR(100),
    old_value     TEXT,
    new_value     TEXT,
    metadata      JSONB        NOT NULL DEFAULT '{}'::JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT ticket_lifecycle_events_ticket_fk
        FOREIGN KEY (ticket_id)
        REFERENCES tickets (id) ON DELETE CASCADE,

    CONSTRAINT ticket_lifecycle_events_actor_fk
        FOREIGN KEY (actor_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,

    CONSTRAINT ticket_lifecycle_events_type_check
        CHECK (event_type IN (
            'TICKET', 'FIELD', 'STATUS', 'ASSIGNMENT', 'COMMENT', 'ATTACHMENT'
        ))
);

CREATE INDEX ticket_lifecycle_events_ticket_idx     ON ticket_lifecycle_events (ticket_id,     created_at DESC);
CREATE INDEX ticket_lifecycle_events_actor_idx      ON ticket_lifecycle_events (actor_user_id);
CREATE INDEX ticket_lifecycle_events_type_idx       ON ticket_lifecycle_events (event_type, event_action);
CREATE INDEX ticket_lifecycle_events_created_at_idx ON ticket_lifecycle_events (created_at DESC);
