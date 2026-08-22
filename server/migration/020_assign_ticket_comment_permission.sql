/**
 * ============================================================================
 * Migration: 020_assign_ticket_comment_permission
 * ============================================================================
 *
 * Purpose:
 * Assigns the ticket:comment permission to the Developer role.
 * ============================================================================
 */

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'developer'
  AND p.code = 'ticket:comment'
ON CONFLICT (role_id, permission_id) DO NOTHING;