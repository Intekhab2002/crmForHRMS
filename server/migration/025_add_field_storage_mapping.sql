/**
 * ============================================================================
 * Migration: 025_add_field_storage_mapping
 * ============================================================================
 * Purpose:
 *     Add explicit persistence mapping to canonical field metadata.
 *
 * storage_type:
 *     relational  -> physical tickets/CRM column
 *     custom_data  -> tickets.custom_data JSONB key
 *     reference    -> controlled entity/reference mapping
 *     specialized  -> specialized subsystem (e.g. attachments)
 *
 * No executable code is stored in this metadata.
 * ============================================================================
 */

ALTER TABLE field_definitions
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20);

ALTER TABLE field_definitions
ADD COLUMN IF NOT EXISTS storage_column VARCHAR(150);

ALTER TABLE field_definitions
ADD COLUMN IF NOT EXISTS storage_key VARCHAR(150);

ALTER TABLE field_definitions
ADD COLUMN IF NOT EXISTS reference_entity VARCHAR(100);

ALTER TABLE field_definitions
DROP CONSTRAINT IF EXISTS field_definitions_storage_mapping_check;

ALTER TABLE field_definitions
ADD CONSTRAINT field_definitions_storage_mapping_check
CHECK (
    (
        storage_type = 'relational'
        AND storage_column IS NOT NULL
        AND storage_key IS NULL
        AND reference_entity IS NULL
    )
    OR
    (
        storage_type = 'custom_data'
        AND storage_key IS NOT NULL
        AND storage_column IS NULL
        AND reference_entity IS NULL
    )
    OR
    (
        storage_type = 'reference'
        AND reference_entity IS NOT NULL
        AND storage_column IS NULL
        AND storage_key IS NULL
    )
    OR
    (
        storage_type = 'specialized'
        AND storage_key IS NOT NULL
        AND storage_column IS NULL
        AND reference_entity IS NULL
    )
    OR
    storage_type IS NULL
);

CREATE INDEX IF NOT EXISTS
    field_definitions_storage_type_idx
ON field_definitions(storage_type);

CREATE INDEX IF NOT EXISTS
    field_definitions_storage_key_idx
ON field_definitions(storage_key)
WHERE storage_key IS NOT NULL;

/*
 * Backfill only mappings that are provably relational from the existing
 * tickets table. Existing unknown fields remain unmapped until Phase 0/1
 * runtime inventory confirms their correct persistence strategy.
 */

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'subject'
WHERE field_key = 'subject'
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'description'
WHERE field_key = 'description'
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'issue_type'
WHERE field_key IN ('issue_type', 'issueType')
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'priority'
WHERE field_key = 'priority'
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'status'
WHERE field_key = 'status'
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'organization_id'
WHERE field_key = 'organization'
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'department_id'
WHERE field_key = 'department'
  AND storage_type IS NULL;

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'assigned_employee_id'
WHERE field_key IN ('assignee', 'assigned_to')
  AND storage_type IS NULL;
