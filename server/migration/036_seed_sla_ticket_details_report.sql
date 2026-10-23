BEGIN;
INSERT INTO report_definitions (
  code, name, description, report_type, version, configuration, is_active
) VALUES (
  'SLA_TICKET_DETAILS',
  'SLA Ticket Details',
  'Ticket-level SLA timing report with target, elapsed, remaining, due time, policy and activation timestamp.',
  'SLA',
  '1.0',
  '{"calculationVersion":"SLA-TICKET-DETAILS-1.0","supportsPdf":true,"supportsExcel":true,"filters":["period","policy","status"],"primarySources":["ticket_sla_run_history","ticket_sla","tickets"],"precision":"whole_business_minutes"}'::jsonb,
  TRUE
)
ON CONFLICT (code, version) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  report_type = EXCLUDED.report_type,
  configuration = EXCLUDED.configuration,
  is_active = TRUE;
COMMIT;
