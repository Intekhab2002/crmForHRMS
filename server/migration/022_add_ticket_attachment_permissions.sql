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
    'ticket:attachment',
    'Manage Ticket Attachments',
    'Upload, view, and delete ticket attachments.',
    'ticket',
    'attachment',
    true,
    true
)
ON CONFLICT (code) DO NOTHING;