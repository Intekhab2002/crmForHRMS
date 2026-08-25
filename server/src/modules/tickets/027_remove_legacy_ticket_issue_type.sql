/*
 * Remove legacy Ticket issue_type.
 *
 * The current Ticket model uses `category`.
 * issue_type is no longer part of the application-level Ticket
 * configuration and therefore must not remain a required database field.
 */

ALTER TABLE tickets
    DROP CONSTRAINT IF EXISTS tickets_issue_type_not_blank;

ALTER TABLE tickets
    DROP CONSTRAINT IF EXISTS tickets_issue_type_not_null;

ALTER TABLE tickets
    DROP COLUMN IF EXISTS issue_type;