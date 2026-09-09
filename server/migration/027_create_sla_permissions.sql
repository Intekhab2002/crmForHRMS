-- ============================================================================
-- CRM for HRMS
-- Migration 027: SLA permissions and default-role permission foundation
-- ============================================================================
BEGIN;

-- Permission codes follow the existing resource:action convention.
-- ON CONFLICT keeps this migration safe to execute against environments where
-- one or more permissions were already introduced by another additive change.

INSERT INTO permissions (
    id,
    code,
    name,
    description,
    resource,
    action,
    is_system,
    is_active
)
VALUES
    (
        gen_random_uuid(),
        'sla:read',
        'View SLA',
        'View SLA policies, calendars, holidays and ticket SLA status.',
        'sla',
        'read',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:create',
        'Create SLA',
        'Create SLA policies and calendars.',
        'sla',
        'create',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:update',
        'Update SLA',
        'Update SLA policies and calendar configuration.',
        'sla',
        'update',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:delete',
        'Delete SLA',
        'Delete or safely deactivate SLA configuration.',
        'sla',
        'delete',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:activate',
        'Activate SLA',
        'Activate or deactivate SLA policies and calendars.',
        'sla',
        'activate',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:calendar_read',
        'View SLA Calendars',
        'View SLA business calendars and holidays.',
        'sla',
        'calendar_read',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:calendar_create',
        'Create SLA Calendar',
        'Create SLA business calendars.',
        'sla',
        'calendar_create',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:calendar_update',
        'Update SLA Calendar',
        'Update SLA business calendar settings.',
        'sla',
        'calendar_update',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:calendar_delete',
        'Delete SLA Calendar',
        'Delete or safely deactivate SLA calendars.',
        'sla',
        'calendar_delete',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:holiday_read',
        'View SLA Holidays',
        'View SLA calendar holidays.',
        'sla',
        'holiday_read',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:holiday_create',
        'Create SLA Holiday',
        'Create SLA calendar holidays.',
        'sla',
        'holiday_create',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:holiday_update',
        'Update SLA Holiday',
        'Update SLA calendar holidays.',
        'sla',
        'holiday_update',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:holiday_delete',
        'Delete SLA Holiday',
        'Delete SLA calendar holidays.',
        'sla',
        'holiday_delete',
        TRUE,
        TRUE
    ),
    (
        gen_random_uuid(),
        'sla:recalculate',
        'Recalculate Ticket SLA',
        'Recalculate a ticket SLA for administrative diagnostics.',
        'sla',
        'recalculate',
        TRUE,
        TRUE
    )
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    is_system = TRUE,
    is_active = TRUE;

-- Default-role permission assignment is intentionally left unchanged here.
-- The existing default_role_permissions table remains the source of truth for
-- permissions inherited by newly created custom roles.

COMMIT;
