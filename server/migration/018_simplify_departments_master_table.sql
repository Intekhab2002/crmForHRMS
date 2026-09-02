BEGIN;

-- ---------------------------------------------------------------------------
-- Simplify departments into a configurable master/select table.
--
-- Final structure:
--   id
--   code
--   name
--   description
--   is_active
--   display_order
--   created_at
--   updated_at
--
-- Existing department IDs, codes, names, descriptions and timestamps are
-- preserved so existing foreign-key references remain valid.
-- ---------------------------------------------------------------------------

-- Remove obsolete hierarchy/organization relationship.
ALTER TABLE departments
    DROP COLUMN IF EXISTS organization_id;

ALTER TABLE departments
    DROP COLUMN IF EXISTS parent_department_id;

-- Remove obsolete department contact information.
ALTER TABLE departments
    DROP COLUMN IF EXISTS contact_email;

ALTER TABLE departments
    DROP COLUMN IF EXISTS contact_phone;

ALTER TABLE departments
    DROP COLUMN IF EXISTS website;

-- Remove obsolete department address information.
ALTER TABLE departments
    DROP COLUMN IF EXISTS address_line1;

ALTER TABLE departments
    DROP COLUMN IF EXISTS address_line2;

ALTER TABLE departments
    DROP COLUMN IF EXISTS city;

ALTER TABLE departments
    DROP COLUMN IF EXISTS district;

ALTER TABLE departments
    DROP COLUMN IF EXISTS state;

ALTER TABLE departments
    DROP COLUMN IF EXISTS postal_code;

-- Department type and short name are no longer required for a simple
-- configurable select/master-data table.
ALTER TABLE departments
    DROP COLUMN IF EXISTS department_type;

ALTER TABLE departments
    DROP COLUMN IF EXISTS short_name;

-- ---------------------------------------------------------------------------
-- Standardize lifecycle column.
-- The old Department module used status = active/inactive.
-- ---------------------------------------------------------------------------

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

UPDATE departments
SET is_active = CASE
    WHEN LOWER(COALESCE(status, 'active')) = 'active' THEN TRUE
    ELSE FALSE
END;

ALTER TABLE departments
    ALTER COLUMN is_active SET DEFAULT TRUE;

ALTER TABLE departments
    ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE departments
    DROP COLUMN IF EXISTS status;

-- ---------------------------------------------------------------------------
-- Standard display ordering for configurable select options.
-- ---------------------------------------------------------------------------

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS display_order INTEGER;

UPDATE departments
SET display_order = 0
WHERE display_order IS NULL;

ALTER TABLE departments
    ALTER COLUMN display_order SET DEFAULT 0;

ALTER TABLE departments
    ALTER COLUMN display_order SET NOT NULL;

ALTER TABLE departments
    ADD CONSTRAINT departments_display_order_check
    CHECK (display_order >= 0);

-- ---------------------------------------------------------------------------
-- Standard indexes used by configurable master/select tables.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_departments_active_display_order
    ON departments (is_active, display_order);

COMMIT;