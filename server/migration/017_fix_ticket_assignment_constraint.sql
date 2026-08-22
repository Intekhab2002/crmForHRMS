ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_assigned_at_check;

ALTER TABLE tickets
ADD CONSTRAINT tickets_assigned_at_check
CHECK (
    assigned_at IS NULL
    OR assigned_user_id IS NOT NULL
);