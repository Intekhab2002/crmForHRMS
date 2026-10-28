BEGIN;

ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Allow historical inactive contacts to retain their mobile number while
-- ensuring that only one active contact uses a number per organization.
DROP INDEX IF EXISTS contacts_organization_mobile_unique_idx;

CREATE UNIQUE INDEX IF NOT EXISTS contacts_organization_mobile_active_unique_idx
    ON contacts (organization_id, mobile_phone)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS contacts_active_organization_idx
    ON contacts (organization_id, is_active);

COMMIT;