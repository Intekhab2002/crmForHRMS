/**
 * ============================================================================
 * Migration: 024_add_ticket_custom_data
 * ============================================================================
 * Purpose:
 *     Add controlled JSONB storage for metadata-defined ticket business fields.
 *
 * Guardrail:
 *     Ordinary administrator field changes must never ALTER TABLE.
 * ============================================================================
 */

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS custom_data JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS
    tickets_custom_data_gin_idx
ON tickets
USING GIN (custom_data jsonb_path_ops);
