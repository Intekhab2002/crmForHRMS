BEGIN;

CREATE SEQUENCE IF NOT EXISTS report_number_seq AS BIGINT START WITH 1 INCREMENT BY 1 MINVALUE 1;

CREATE TABLE IF NOT EXISTS report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(64) NOT NULL UNIQUE,
    report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE RESTRICT,

    report_code VARCHAR(100) NOT NULL,
    report_version VARCHAR(20) NOT NULL,
    calculation_version VARCHAR(50) NOT NULL,

    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    data_cutoff TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',

    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',

    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    generated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    record_count INTEGER NOT NULL DEFAULT 0,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    error_code VARCHAR(100),
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_runs_status_ck
        CHECK (status IN ('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELLED')),
    CONSTRAINT report_runs_period_ck
        CHECK (period_end > period_start),
    CONSTRAINT report_runs_cutoff_ck
        CHECK (data_cutoff >= period_start),
    CONSTRAINT report_runs_record_count_ck
        CHECK (record_count >= 0),
    CONSTRAINT report_runs_filters_object_ck
        CHECK (jsonb_typeof(filters) = 'object'),
    CONSTRAINT report_runs_parameters_object_ck
        CHECK (jsonb_typeof(parameters) = 'object')
);

CREATE INDEX IF NOT EXISTS report_runs_definition_idx ON report_runs(report_definition_id);
CREATE INDEX IF NOT EXISTS report_runs_code_created_idx ON report_runs(report_code, created_at DESC);
CREATE INDEX IF NOT EXISTS report_runs_status_idx ON report_runs(status);
CREATE INDEX IF NOT EXISTS report_runs_requested_by_idx ON report_runs(requested_by_user_id);
CREATE INDEX IF NOT EXISTS report_runs_period_idx ON report_runs(period_start, period_end);

CREATE OR REPLACE FUNCTION set_report_runs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS report_runs_set_updated_at ON report_runs;
CREATE TRIGGER report_runs_set_updated_at
BEFORE UPDATE ON report_runs
FOR EACH ROW EXECUTE FUNCTION set_report_runs_updated_at();


CREATE OR REPLACE FUNCTION prevent_completed_report_run_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Completed report runs are immutable.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS report_runs_prevent_completed_mutation ON report_runs;
CREATE TRIGGER report_runs_prevent_completed_mutation
BEFORE UPDATE ON report_runs
FOR EACH ROW EXECUTE FUNCTION prevent_completed_report_run_mutation();

COMMIT;
