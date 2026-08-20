/**
 * ============================================================================
 * Migration: 012_create_form_definitions
 * ============================================================================
 *
 * Purpose:
 *     Stores reusable CRM form definitions.
 *
 * Examples:
 *
 *     ticket.create
 *     ticket.edit
 *     ticket.view
 *     user.create
 *     user.edit
 *
 * A form definition does not contain individual field metadata.
 * Field assignments are stored separately.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,

    module VARCHAR(100) NOT NULL,

    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_by UUID,

    updated_by UUID,

    deleted_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMPTZ,

    CONSTRAINT form_definitions_code_format_check
        CHECK (
            code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'
        ),

    CONSTRAINT form_definitions_status_check
        CHECK (
            status IN ('active', 'inactive')
        ),

    CONSTRAINT form_definitions_name_not_blank
        CHECK (
            length(btrim(name)) > 0
        ),

    CONSTRAINT form_definitions_module_not_blank
        CHECK (
            length(btrim(module)) > 0
        ),

    CONSTRAINT form_definitions_deleted_state_check
        CHECK (
            (
                is_deleted = FALSE
                AND deleted_at IS NULL
            )
            OR
            (
                is_deleted = TRUE
                AND deleted_at IS NOT NULL
            )
        ),

    CONSTRAINT form_definitions_created_by_fk
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT form_definitions_updated_by_fk
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT form_definitions_deleted_by_fk
        FOREIGN KEY (deleted_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

/**
 * A form code is globally unique.
 */
CREATE UNIQUE INDEX IF NOT EXISTS
    form_definitions_code_unique_idx
ON form_definitions(code);

/**
 * Runtime lookup.
 */
CREATE INDEX IF NOT EXISTS
    form_definitions_module_idx
ON form_definitions(module);

CREATE INDEX IF NOT EXISTS
    form_definitions_status_idx
ON form_definitions(status);

CREATE INDEX IF NOT EXISTS
    form_definitions_deleted_idx
ON form_definitions(is_deleted);


/**
 * ============================================================================
 * Updated-at trigger
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION set_form_definitions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
    form_definitions_set_updated_at
ON form_definitions;

CREATE TRIGGER
    form_definitions_set_updated_at
BEFORE UPDATE ON form_definitions
FOR EACH ROW
EXECUTE FUNCTION set_form_definitions_updated_at();