CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY,

    ticket_id UUID NOT NULL,
    user_id UUID NOT NULL,

    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_comments_ticket_fk
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT ticket_comments_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT ticket_comments_comment_not_blank
        CHECK (length(btrim(comment)) > 0),

    CONSTRAINT ticket_comments_id_not_null
        CHECK (id IS NOT NULL),

    CONSTRAINT ticket_comments_ticket_not_null
        CHECK (ticket_id IS NOT NULL),

    CONSTRAINT ticket_comments_user_not_null
        CHECK (user_id IS NOT NULL),

    CONSTRAINT ticket_comments_created_at_not_null
        CHECK (created_at IS NOT NULL),

    CONSTRAINT ticket_comments_updated_at_not_null
        CHECK (updated_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ticket_comments_ticket_idx
    ON ticket_comments (ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ticket_comments_user_idx
    ON ticket_comments (user_id);

CREATE OR REPLACE FUNCTION set_ticket_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_comments_set_updated_at
    ON ticket_comments;

CREATE TRIGGER ticket_comments_set_updated_at
BEFORE UPDATE ON ticket_comments
FOR EACH ROW
EXECUTE FUNCTION set_ticket_comments_updated_at();