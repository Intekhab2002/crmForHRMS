BEGIN;

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
    'Canonical metadata-driven Ticket list form.',
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
    'Canonical metadata-driven Ticket view form.',
    'active'
)
ON CONFLICT (code) DO NOTHING;

COMMIT;