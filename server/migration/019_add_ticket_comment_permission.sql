/**
 * ============================================================================
 * Migration: 019_add_ticket_comment_permission
 * ============================================================================
 *
 * Purpose:
 * Adds the permission required to add comments to tickets.
 * ============================================================================
 */

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
VALUES (
    gen_random_uuid(),
    'ticket:comment',
    'Comment on Tickets',
    'Add comments to tickets.',
    'ticket',
    'comment',
    TRUE,
    TRUE
)
ON CONFLICT (code) DO NOTHING;