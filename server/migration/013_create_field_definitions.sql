/**
 * ============================================================================
 * Migration: 013_create_field_definitions
 * ============================================================================
 *
 * Purpose:
 *     Stores reusable field definitions.
 *
 * A field exists independently from any particular form.
 *
 * Example:
 *
 *     priority
 *     subject
 *     description
 *     department
 *
 * Form-specific behavior is stored in form_field_assignments.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    field_key VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,

    label VARCHAR(200) NOT NULL,

    description TEXT,

    type VARCHAR(50) NOT NULL,

    data_type VARCHAR(50) NOT NULL,

    placeholder VARCHAR(255),

    help_text TEXT,

    default_value JSONB,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    /**
     * Default behavior.
     *
     * These are defaults only.
     * A form assignment can override them.
     */
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,

    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    is_editable BOOLEAN NOT NULL DEFAULT TRUE,

    is_read_only BOOLEAN NOT NULL DEFAULT FALSE,

    is_required BOOLEAN NOT NULL DEFAULT FALSE,

    is_searchable BOOLEAN NOT NULL DEFAULT FALSE,

    is_filterable BOOLEAN NOT NULL DEFAULT FALSE,

    is_sortable BOOLEAN NOT NULL DEFAULT FALSE,

    /**
     * Declarative validation metadata.
     *
     * Example:
     *
     * {
     *     "minLength": 3,
     *     "maxLength": 100,
     *     "email": false
     * }
     */
    validation_config JSONB NOT NULL DEFAULT '{}'::JSONB,

    /**
     * Field options.
     *
     * Example:
     *
     * {
     *     "static": [
     *         {
     *             "label": "High",
     *             "value": "HIGH"
     *         }
     *     ]
     * }
     *
     * No executable JavaScript is allowed here.
     */
    options_config JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_by UUID,

    updated_by UUID,

    deleted_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMPTZ,

    CONSTRAINT field_definitions_field_key_unique
        UNIQUE (field_key),

    CONSTRAINT field_definitions_status_check
        CHECK (
            status IN ('active', 'inactive')
        ),

    CONSTRAINT field_definitions_deleted_state_check
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

    CONSTRAINT field_definitions_type_check
        CHECK (
            type IN (
                'text',
                'textarea',
                'number',
                'email',
                'password',
                'select',
                'multi_select',
                'autocomplete',
                'date',
                'datetime',
                'time',
                'checkbox',
                'switch',
                'radio',
                'file'
            )
        ),

    CONSTRAINT field_definitions_data_type_check
        CHECK (
            data_type IN (
                'string',
                'number',
                'boolean',
                'date',
                'datetime',
                'time',
                'file',
                'array'
            )
        ),

    CONSTRAINT field_definitions_name_not_blank
        CHECK (
            length(btrim(name)) > 0
        ),

    CONSTRAINT field_definitions_label_not_blank
        CHECK (
            length(btrim(label)) > 0
        ),

    CONSTRAINT field_definitions_created_by_fk
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT field_definitions_updated_by_fk
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT field_definitions_deleted_by_fk
        FOREIGN KEY (deleted_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


/**
 * Runtime lookup indexes.
 */

CREATE INDEX IF NOT EXISTS
    field_definitions_status_idx
ON field_definitions(status);

CREATE INDEX IF NOT EXISTS
    field_definitions_deleted_idx
ON field_definitions(is_deleted);

CREATE INDEX IF NOT EXISTS
    field_definitions_type_idx
ON field_definitions(type);

CREATE INDEX IF NOT EXISTS
    field_definitions_data_type_idx
ON field_definitions(data_type);


/**
 * JSONB indexes.
 */

CREATE INDEX IF NOT EXISTS
    field_definitions_validation_config_gin_idx
ON field_definitions
USING GIN(validation_config);

CREATE INDEX IF NOT EXISTS
    field_definitions_options_config_gin_idx
ON field_definitions
USING GIN(options_config);


/**
 * ============================================================================
 * Updated-at trigger
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION set_field_definitions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
    field_definitions_set_updated_at
ON field_definitions;

CREATE TRIGGER
    field_definitions_set_updated_at
BEFORE UPDATE ON field_definitions
FOR EACH ROW
EXECUTE FUNCTION set_field_definitions_updated_at();