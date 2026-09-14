CREATE UNIQUE INDEX IF NOT EXISTS ux_ticket_sla_one_open_segment
ON ticket_sla_segments (ticket_sla_id)
WHERE ended_at IS NULL;