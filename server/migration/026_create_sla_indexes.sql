-- ============================================================================
-- CRM for HRMS
-- Migration 026: SLA indexes and query-performance support
-- ============================================================================
BEGIN;

CREATE INDEX IF NOT EXISTS sla_policy_rules_policy_idx
    ON sla_policy_rules (sla_policy_id);

CREATE INDEX IF NOT EXISTS sla_policy_rules_enabled_idx
    ON sla_policy_rules (is_enabled);

CREATE INDEX IF NOT EXISTS sla_calendar_holidays_calendar_date_idx
    ON sla_calendar_holidays (calendar_id, holiday_date);

CREATE INDEX IF NOT EXISTS sla_calendar_holidays_date_idx
    ON sla_calendar_holidays (holiday_date);

CREATE INDEX IF NOT EXISTS ticket_sla_status_idx
    ON ticket_sla (status);

CREATE INDEX IF NOT EXISTS ticket_sla_policy_idx
    ON ticket_sla (sla_policy_id);

CREATE INDEX IF NOT EXISTS ticket_sla_running_idx
    ON ticket_sla (last_calculated_at)
    WHERE status = 'RUNNING';

CREATE INDEX IF NOT EXISTS ticket_sla_breached_idx
    ON ticket_sla (breached_at)
    WHERE breached_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS ticket_sla_segments_sla_idx
    ON ticket_sla_segments (ticket_sla_id, started_at DESC);

-- Useful for policy resolution by trigger and effective period.
CREATE INDEX IF NOT EXISTS sla_policies_resolution_idx
    ON sla_policies (
        trigger_field_key,
        trigger_value_key,
        is_active,
        effective_from,
        effective_to,
        priority
    );

COMMIT;
