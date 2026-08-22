CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY,

    ticket_id UUID NOT NULL,
    user_id UUID NOT NULL,

    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_attachments_ticket_fk
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT ticket_attachments_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT ticket_attachments_original_name_not_blank
        CHECK (length(btrim(original_name)) > 0),

    CONSTRAINT ticket_attachments_stored_name_not_blank
        CHECK (length(btrim(stored_name)) > 0),

    CONSTRAINT ticket_attachments_mime_type_not_blank
        CHECK (length(btrim(mime_type)) > 0),

    CONSTRAINT ticket_attachments_storage_path_not_blank
        CHECK (length(btrim(storage_path)) > 0),

    CONSTRAINT ticket_attachments_file_size_positive
        CHECK (file_size > 0),

    CONSTRAINT ticket_attachments_file_size_limit
        CHECK (file_size <= 10485760)
);

CREATE INDEX IF NOT EXISTS ticket_attachments_ticket_idx
    ON ticket_attachments (ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ticket_attachments_user_idx
    ON ticket_attachments (user_id);

CREATE OR REPLACE FUNCTION set_ticket_attachments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_attachments_set_updated_at
    ON ticket_attachments;

CREATE TRIGGER ticket_attachments_set_updated_at
BEFORE UPDATE ON ticket_attachments
FOR EACH ROW
EXECUTE FUNCTION set_ticket_attachments_updated_at();