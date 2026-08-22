CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    name VARCHAR(200) NOT NULL,

    mobile_phone VARCHAR(30) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT contacts_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT contacts_name_not_blank
        CHECK (length(btrim(name)) > 0),

    CONSTRAINT contacts_mobile_not_blank
        CHECK (length(btrim(mobile_phone)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_organization_mobile_unique_idx
    ON contacts (
        organization_id,
        mobile_phone
    );

    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS contact_id UUID;


    DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tickets_contact_fk'
    ) THEN
        ALTER TABLE tickets
            ADD CONSTRAINT tickets_contact_fk
            FOREIGN KEY (contact_id)
            REFERENCES contacts(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS tickets_contact_idx
    ON tickets (contact_id)
    WHERE contact_id IS NOT NULL;


    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS assigned_user_id UUID;


    DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tickets_assigned_user_fk'
    ) THEN
        ALTER TABLE tickets
            ADD CONSTRAINT tickets_assigned_user_fk
            FOREIGN KEY (assigned_user_id)
            REFERENCES users(id)
            ON UPDATE CASCADE
            ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS tickets_assigned_user_idx
    ON tickets (assigned_user_id)
    WHERE assigned_user_id IS NOT NULL;