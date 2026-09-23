BEGIN;

CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT report_definitions_code_version_uk UNIQUE (code, version),
    CONSTRAINT report_definitions_configuration_object_ck
        CHECK (jsonb_typeof(configuration) = 'object')
);

CREATE INDEX IF NOT EXISTS report_definitions_active_idx
    ON report_definitions(is_active);

CREATE OR REPLACE FUNCTION set_report_definitions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS report_definitions_set_updated_at ON report_definitions;
CREATE TRIGGER report_definitions_set_updated_at
BEFORE UPDATE ON report_definitions
FOR EACH ROW EXECUTE FUNCTION set_report_definitions_updated_at();

INSERT INTO report_definitions (
    code, name, description, report_type, version, configuration, is_active
)
VALUES (
    'SLA_COMPLIANCE',
    'SLA Compliance & Performance',
    'Auditable SLA compliance and performance report based on historical SLA execution.',
    'SLA',
    '1.0',
    '{
      "calculationVersion":"SLA-CALC-1.0",
      "supportsPdf":true,
      "supportsExcel":true,
      "filters":["period","policy","severity","status"],
      "historicalSources":["ticket_sla_run_history","ticket_sla_segments"],
      "precision":"whole_business_minutes"
    }'::jsonb,
    TRUE
)
ON CONFLICT (code, version) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    report_type = EXCLUDED.report_type,
    configuration = EXCLUDED.configuration,
    is_active = EXCLUDED.is_active;

COMMIT;
