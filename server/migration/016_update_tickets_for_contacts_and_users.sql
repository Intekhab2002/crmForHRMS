ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS contact_id UUID,
    ADD COLUMN IF NOT EXISTS assigned_user_id UUID;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_contact_id_fkey
        FOREIGN KEY (contact_id)
        REFERENCES contacts(id)
        ON DELETE SET NULL;

ALTER TABLE tickets
    ADD CONSTRAINT tickets_assigned_user_id_fkey
        FOREIGN KEY (assigned_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_contact_id
    ON tickets(contact_id);

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user_id
    ON tickets(assigned_user_id);