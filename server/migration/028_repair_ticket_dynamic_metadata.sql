/**
 * ============================================================================
 * Migration: 027_repair_ticket_dynamic_metadata
 * ============================================================================
 *
 * Repairs existing field metadata that was created before migration 026.
 *
 * Migration 026 intentionally uses ON CONFLICT DO NOTHING, therefore
 * pre-existing field definitions can retain NULL storage mappings.
 *
 * This migration makes the canonical Ticket runtime metadata deterministic.
 * ============================================================================
 */

BEGIN;

/* --------------------------------------------------------------------------
 * 1. Repair canonical storage mappings
 * -------------------------------------------------------------------------- */

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'name'
WHERE field_key = 'name';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'mobile_phone'
WHERE field_key = 'mobile_phone';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'address'
WHERE field_key = 'address';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'contact_name'
WHERE field_key = 'contact_name';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'email_id'
WHERE field_key = 'email_id';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'service_type'
WHERE field_key = 'service_type';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'district'
WHERE field_key = 'district';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'category'
WHERE field_key = 'category';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'problem_statement'
WHERE field_key = 'problem_statement';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'employee_current_office_name_id'
WHERE field_key = 'employee_current_office_name_id';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'employee_id'
WHERE field_key = 'employee_id';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'current_bill_status'
WHERE field_key = 'current_bill_status';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'bill_reference_no'
WHERE field_key = 'bill_reference_no';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'severity'
WHERE field_key = 'severity';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'expected_resolution_date'
WHERE field_key = 'expected_resolution_date';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'duplicate_ticket'
WHERE field_key = 'duplicate_ticket';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'letter_no'
WHERE field_key = 'letter_no';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'dependency_category'
WHERE field_key = 'dependency_category';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'issue_category'
WHERE field_key = 'issue_category';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'solution'
WHERE field_key = 'solution';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'resolution'
WHERE field_key = 'resolution';

UPDATE field_definitions
SET
    storage_type = 'custom_data',
    storage_column = NULL,
    storage_key = 'created_by'
WHERE field_key = 'created_by';


/* --------------------------------------------------------------------------
 * 2. Restore canonical relational mappings
 * -------------------------------------------------------------------------- */

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'subject',
    storage_key = NULL,
    reference_entity = NULL
WHERE field_key = 'subject';

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'department_id',
    storage_key = NULL,
    reference_entity = NULL
WHERE field_key = 'department';

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'status',
    storage_key = NULL,
    reference_entity = NULL
WHERE field_key = 'status';

UPDATE field_definitions
SET
    storage_type = 'relational',
    storage_column = 'assigned_employee_id',
    storage_key = NULL,
    reference_entity = NULL
WHERE field_key = 'assigned_to';


/* --------------------------------------------------------------------------
 * 3. Attachment remains specialized
 * -------------------------------------------------------------------------- */

UPDATE field_definitions
SET
    storage_type = 'specialized',
    storage_column = NULL,
    storage_key = 'ticket_attachment',
    reference_entity = NULL
WHERE field_key = 'attachment';


/* --------------------------------------------------------------------------
 * 4. Canonical form definitions
 * -------------------------------------------------------------------------- */

INSERT INTO form_definitions (
    code,
    name,
    module,
    description,
    status
)
VALUES (
    'ticket.create',
    'Create Ticket',
    'ticket',
    'Canonical metadata-driven Ticket create form.',
    'active'
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    description = EXCLUDED.description,
    status = EXCLUDED.status;


INSERT INTO form_definitions (
    code,
    name,
    module,
    description,
    status
)
VALUES (
    'ticket.update',
    'Update Ticket',
    'ticket',
    'Canonical metadata-driven Ticket update form.',
    'active'
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    description = EXCLUDED.description,
    status = EXCLUDED.status;


INSERT INTO form_definitions (
    code,
    name,
    module,
    description,
    status
)
VALUES (
    'ticket.list',
    'Ticket List',
    'ticket',
    'Canonical metadata-driven Ticket list form.',
    'active'
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    description = EXCLUDED.description,
    status = EXCLUDED.status;


INSERT INTO form_definitions (
    code,
    name,
    module,
    description,
    status
)
VALUES (
    'ticket.view',
    'Ticket View',
    'ticket',
    'Canonical metadata-driven Ticket view form.',
    'active'
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    description = EXCLUDED.description,
    status = EXCLUDED.status;


/* --------------------------------------------------------------------------
 * 5. Rebuild canonical assignments for existing fields
 *
 * Existing assignments are preserved.
 * Missing assignments are inserted.
 * -------------------------------------------------------------------------- */

INSERT INTO form_field_assignments (
    form_id,
    field_id,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    display_order,
    section
)
SELECT
    f.id,
    d.id,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    d.is_required,
    ROW_NUMBER() OVER (
        PARTITION BY f.id
        ORDER BY d.id
    ),
    'general'
FROM form_definitions f
JOIN field_definitions d
    ON d.status = 'active'
   AND d.is_deleted = FALSE
WHERE f.code IN (
    'ticket.create',
    'ticket.update',
    'ticket.list',
    'ticket.view'
)
ON CONFLICT (form_id, field_id) DO NOTHING;


COMMIT;