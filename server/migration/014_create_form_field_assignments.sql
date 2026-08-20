/**
 * ============================================================================
 * Migration: 014_create_form_field_assignments
 * ============================================================================
 *
 * Purpose:
 *     Associates reusable fields with forms.
 *
 * This table contains form-specific overrides.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS form_field_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    form_id UUID NOT NULL,

    field_id UUID NOT NULL,

    /**
     * Form-specific behavior.
     *
     * NULL means:
     * "Use the field definition default."
     */
    is_visible BOOLEAN,

    is_enabled BOOLEAN,

    is_editable BOOLEAN,

    is_read_only BOOLEAN,

    is_required BOOLEAN,

    is_searchable BOOLEAN,

    is_filterable BOOLEAN,

    is_sortable BOOLEAN,

    /**
     * Layout.
     */
    display_order INTEGER NOT NULL DEFAULT 0,

    section VARCHAR(100),

    grid_size SMALLINT,

    column_width VARCHAR(50),

    /**
     * Optional form-specific label/help/placeholder overrides.
     */
    label_override VARCHAR(200),

    placeholder_override VARCHAR(255),

    help_text_override TEXT,

    /**
     * Optional form-specific default value.
     */
    default_value_override JSONB,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT form_field_assignments_form_fk
        FOREIGN KEY (form_id)
        REFERENCES form_definitions(id)
        ON DELETE CASCADE,

    CONSTRAINT form_field_assignments_field_fk
        FOREIGN KEY (field_id)
        REFERENCES field_definitions(id)
        ON DELETE RESTRICT,

    CONSTRAINT form_field_assignments_unique
        UNIQUE (form_id, field_id),

    CONSTRAINT form_field_assignments_display_order_check
        CHECK (
            display_order >= 0
        ),

    CONSTRAINT form_field_assignments_grid_size_check
        CHECK (
            grid_size IS NULL
            OR grid_size BETWEEN 1 AND 12
        ),

    CONSTRAINT form_field_assignments_column_width_check
        CHECK (
            column_width IS NULL
            OR length(btrim(column_width)) > 0
        ),

    CONSTRAINT form_field_assignments_created_by_fk
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT form_field_assignments_updated_by_fk
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


/**
 * Runtime form loading.
 */

CREATE INDEX IF NOT EXISTS
    form_field_assignments_form_idx
ON form_field_assignments(form_id, display_order);


/**
 * Field reverse lookup.
 */

CREATE INDEX IF NOT EXISTS
    form_field_assignments_field_idx
ON form_field_assignments(field_id);


/**
 * Section lookup.
 */

CREATE INDEX IF NOT EXISTS
    form_field_assignments_section_idx
ON form_field_assignments(section);


/**
 * Updated-at trigger.
 */

CREATE OR REPLACE FUNCTION set_form_field_assignments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
    form_field_assignments_set_updated_at
ON form_field_assignments;

CREATE TRIGGER
    form_field_assignments_set_updated_at
BEFORE UPDATE ON form_field_assignments
FOR EACH ROW
EXECUTE FUNCTION set_form_field_assignments_updated_at();