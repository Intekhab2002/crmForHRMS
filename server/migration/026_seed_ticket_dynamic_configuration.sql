/**
 * ============================================================================
 * Migration: 026_seed_ticket_dynamic_configuration
 * ============================================================================
 * Phase 1 canonical metadata seed.
 *
 * Idempotency:
 *     Existing field definitions, forms and assignments are preserved.
 *     This migration only inserts missing canonical records.
 *
 * Target inventory:
 *     The 28-field Create Ticket specification supplied for CRM for HRMS.
 *
 * Important:
 *     "Expected Resolution Date" uses the canonical runtime date/date type
 *     even though the business spreadsheet describes its data type as String;
 *     the field type/data-type compatibility registry requires date/date.
 *
 * Data-source endpoints are recorded as declarative metadata only. They are
 * not executed by PostgreSQL.
 * ============================================================================
 */

BEGIN;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'name',
    'Name',
    'Name',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'name'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'mobile_phone',
    'Mobile Phone',
    'Mobile Phone',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'mobile_phone'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'service_type',
    'Service Type',
    'Service Type',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"static":[{"label":"Miscellaneous","value":"Miscellaneous"},{"label":"General Information","value":"General Information"}]}'::JSONB,
    'custom_data',
    NULL,
    'service_type'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'contact_name',
    'Contact Name',
    'Contact Name',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'contact_name'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'email_id',
    'Email Id',
    'Email Id',
    NULL,
    'email',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false,"email":true}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'email_id'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'district',
    'District',
    'District',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"dataSource":{"type":"api","endpoint":"/api/v1/districts"}}'::JSONB,
    'custom_data',
    NULL,
    'district'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'department',
    'Department',
    'Department',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"dataSource":{"type":"api","endpoint":"/api/v1/departments"}}'::JSONB,
    'relational',
    'department_id',
    NULL
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'category',
    'Category',
    'Category',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"static":[{"label":"Enquiry","value":"Enquiry"},{"label":"Issue","value":"Issue"},{"label":"Enhancement","value":"Enhancement"}]}'::JSONB,
    'custom_data',
    NULL,
    'category'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'subject',
    'Subject',
    'Subject',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'relational',
    'subject',
    NULL
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'problem_statement',
    'Problem Statement',
    'Problem Statement',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"dataSource":{"type":"api","endpoint":"/api/v1/problem-statements"}}'::JSONB,
    'custom_data',
    NULL,
    'problem_statement'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'employee_current_office_name_id',
    'EmployeeCurrentOffice Name Id',
    'EmployeeCurrentOffice Name Id',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'employee_current_office_name_id'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'employee_id',
    'Employee ID',
    'Employee ID',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'employee_id'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'current_bill_status',
    'Current Bill status',
    'Current Bill status',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"dataSource":{"type":"api","endpoint":"/api/v1/bill-statuses"}}'::JSONB,
    'custom_data',
    NULL,
    'current_bill_status'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'bill_reference_no',
    'Bill Reference no',
    'Bill Reference no',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'bill_reference_no'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'status',
    'Status',
    'Status',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"static":[{"label":"Open","value":"OPEN"},{"label":"Inprogress","value":"IN_PROGRESS"},{"label":"Wait for Response","value":"PENDING"},{"label":"Closed","value":"CLOSED"}]}'::JSONB,
    'relational',
    'status',
    NULL
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'assigned_to',
    'Assigned To',
    'Assigned To',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"dataSource":{"type":"api","endpoint":"/api/v1/tickets/assignable-users"}}'::JSONB,
    'relational',
    'assigned_user_id',
    NULL
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'severity',
    'Severity',
    'Severity',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"static":[{"label":"Severity1","value":"Severity1"},{"label":"Severity2","value":"Severity2"},{"label":"Severity3","value":"Severity3"}]}'::JSONB,
    'custom_data',
    NULL,
    'severity'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'expected_resolution_date',
    'Expected Resolution Date',
    'Expected Resolution Date',
    NULL,
    'date',
    'date',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'expected_resolution_date'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'duplicate_ticket',
    'Duplicate Ticket - If any',
    'Duplicate Ticket - If any',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'duplicate_ticket'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'created_by',
    'Created By',
    'Created By',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'relational',
    'created_by_user_id',
    NULL
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'issue_category',
    'Issue Category',
    'Issue Category',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"static":[{"label":"Suspected Error","value":"Suspected Error"},{"label":"Process violation","value":"Process violation"}]}'::JSONB,
    'custom_data',
    NULL,
    'issue_category'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'letter_no',
    'Letter No. - If any',
    'Letter No. - If any',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'letter_no'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'dependency_category',
    'Dependency Category',
    'Dependency Category',
    NULL,
    'select',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{"static":[{"label":"CFMS","value":"CFMS"},{"label":"Dev. Team","value":"Dev. Team"},{"label":"Policy Matter","value":"Policy Matter"},{"label":"User-End","value":"User-End"}]}'::JSONB,
    'custom_data',
    NULL,
    'dependency_category'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'description',
    'Description',
    'Description',
    NULL,
    'textarea',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'relational',
    'description',
    NULL
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'initial_diagnosis',
    'Initial Diagnosis',
    'Initial Diagnosis',
    NULL,
    'textarea',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'initial_diagnosis'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'solution',
    'Solution',
    'Solution',
    NULL,
    'textarea',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'solution'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'resolution',
    'Resolution',
    'Resolution',
    NULL,
    'text',
    'string',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'custom_data',
    NULL,
    'resolution'
)
ON CONFLICT (field_key) DO NOTHING;

INSERT INTO field_definitions (
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    status,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    storage_type,
    storage_column,
    storage_key
)
VALUES (
    'attachment',
    'Attachment',
    'Attachment',
    NULL,
    'file',
    'file',
    'active',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    '{"required":false}'::JSONB,
    '{}'::JSONB,
    'specialized',
    NULL,
    'ticket_attachment'
)
ON CONFLICT (field_key) DO NOTHING;

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
    'Canonical metadata-driven Ticket create ticket form.',
    'active'
)
ON CONFLICT (code) DO NOTHING;

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
    'Canonical metadata-driven Ticket update ticket form.',
    'active'
)
ON CONFLICT (code) DO NOTHING;

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
    'Canonical metadata-driven Ticket ticket list form.',
    'active'
)
ON CONFLICT (code) DO NOTHING;

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
    'Canonical metadata-driven Ticket ticket view form.',
    'active'
)
ON CONFLICT (code) DO NOTHING;

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
    1,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'name'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    2,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'mobile_phone'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    3,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'service_type'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    4,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'contact_name'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    5,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'email_id'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    6,
    'organization'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'district'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    7,
    'organization'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'department'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    8,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'category'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    9,
    'subject'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'subject'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    10,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'problem_statement'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    11,
    'employee'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'employee_current_office_name_id'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    12,
    'employee'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'employee_id'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    13,
    'billing'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'current_bill_status'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    14,
    'billing'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'bill_reference_no'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    15,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'status'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    16,
    'assignment'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'assigned_to'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    17,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'severity'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    18,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'expected_resolution_date'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    19,
    'references'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'duplicate_ticket'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    20,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'created_by'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    21,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'issue_category'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    22,
    'references'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'letter_no'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    23,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'dependency_category'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    24,
    'description'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'description'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    25,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'initial_diagnosis'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    26,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'solution'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    27,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'resolution'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    28,
    'attachments'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'attachment'
WHERE f.code = 'ticket.create'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    1,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'name'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    2,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'mobile_phone'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    3,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'service_type'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    4,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'contact_name'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    5,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'email_id'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    6,
    'organization'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'district'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    7,
    'organization'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'department'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    8,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'category'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    9,
    'subject'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'subject'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    10,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'problem_statement'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    11,
    'employee'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'employee_current_office_name_id'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    12,
    'employee'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'employee_id'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    13,
    'billing'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'current_bill_status'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    14,
    'billing'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'bill_reference_no'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    15,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'status'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    16,
    'assignment'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'assigned_to'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    17,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'severity'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    18,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'expected_resolution_date'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    19,
    'references'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'duplicate_ticket'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    20,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'created_by'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    21,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'issue_category'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    22,
    'references'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'letter_no'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    23,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'dependency_category'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    24,
    'description'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'description'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    25,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'initial_diagnosis'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    26,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'solution'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    27,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'resolution'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    28,
    'attachments'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'attachment'
WHERE f.code = 'ticket.update'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    1,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'name'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    2,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'mobile_phone'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    3,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'service_type'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    4,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'contact_name'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    5,
    'requester'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'email_id'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    6,
    'organization'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'district'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    7,
    'organization'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'department'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    8,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'category'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    9,
    'subject'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'subject'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    10,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'problem_statement'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    11,
    'employee'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'employee_current_office_name_id'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    12,
    'employee'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'employee_id'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    13,
    'billing'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'current_bill_status'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    14,
    'billing'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'bill_reference_no'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    15,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'status'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    16,
    'assignment'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'assigned_to'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    17,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'severity'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    18,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'expected_resolution_date'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    19,
    'references'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'duplicate_ticket'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    20,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'created_by'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    21,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'issue_category'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    22,
    'references'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'letter_no'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    23,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'dependency_category'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    24,
    'description'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'description'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    25,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'initial_diagnosis'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    26,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'solution'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    27,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'resolution'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    d.is_required,
    28,
    'attachments'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'attachment'
WHERE f.code = 'ticket.view'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    1,
    'subject'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'subject'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    2,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'service_type'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    3,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'category'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    4,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'status'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    5,
    'assignment'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'assigned_to'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    6,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'severity'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    7,
    'classification'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'dependency_category'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    8,
    'resolution'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'expected_resolution_date'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

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
    FALSE,
    TRUE,
    FALSE,
    9,
    'system'
FROM form_definitions f
JOIN field_definitions d
  ON d.field_key = 'created_by'
WHERE f.code = 'ticket.list'
ON CONFLICT (form_id, field_id) DO NOTHING;

COMMIT;
