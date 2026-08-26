/*
 * ============================================================================
 * Migration: 028_add_user_organization
 * ============================================================================
 *
 * Associates authenticated users with their CRM organization/tenant.
 *
 * The authenticated principal is the source of organization context used by
 * organization-scoped APIs such as contact lookup.
 * ============================================================================
 */

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_organization_fk;

ALTER TABLE users
    ADD CONSTRAINT users_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS users_organization_idx
    ON users (organization_id);

/*
 * Safe bootstrap for a single-organization installation.
 *
 * If there is exactly one active organization, existing users without an
 * organization are associated with it.
 *
 * If there are multiple organizations, no automatic assignment is performed.
 */
DO $$
DECLARE
    active_organization_id UUID;
    active_organization_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO active_organization_count
    FROM organizations
    WHERE status = 'active';

    IF active_organization_count = 1 THEN
        SELECT id
        INTO active_organization_id
        FROM organizations
        WHERE status = 'active'
        LIMIT 1;

        UPDATE users
        SET organization_id = active_organization_id
        WHERE organization_id IS NULL;
    END IF;
END;
$$;