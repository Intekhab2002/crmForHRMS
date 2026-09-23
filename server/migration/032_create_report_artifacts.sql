BEGIN;

CREATE TABLE IF NOT EXISTS report_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_run_id UUID NOT NULL REFERENCES report_runs(id) ON DELETE RESTRICT,
    artifact_type VARCHAR(10) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256 CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_artifacts_type_ck
        CHECK (artifact_type IN ('PDF','XLSX','CSV')),
    CONSTRAINT report_artifacts_size_ck
        CHECK (file_size_bytes >= 0),
    CONSTRAINT report_artifacts_sha256_ck
        CHECK (sha256 ~ '^[0-9a-f]{64}$'),
    CONSTRAINT report_artifacts_run_type_uk
        UNIQUE (report_run_id, artifact_type),
    CONSTRAINT report_artifacts_storage_key_uk
        UNIQUE (storage_key)
);

CREATE INDEX IF NOT EXISTS report_artifacts_run_idx
    ON report_artifacts(report_run_id);


CREATE OR REPLACE FUNCTION prevent_completed_report_artifact_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    run_status VARCHAR(20);
BEGIN
    SELECT status INTO run_status
    FROM report_runs
    WHERE id = COALESCE(OLD.report_run_id, NEW.report_run_id);

    IF run_status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Artifacts belonging to completed report runs are immutable.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS report_artifacts_prevent_completed_update ON report_artifacts;
CREATE TRIGGER report_artifacts_prevent_completed_update
BEFORE UPDATE ON report_artifacts
FOR EACH ROW EXECUTE FUNCTION prevent_completed_report_artifact_mutation();

DROP TRIGGER IF EXISTS report_artifacts_prevent_completed_delete ON report_artifacts;
CREATE TRIGGER report_artifacts_prevent_completed_delete
BEFORE DELETE ON report_artifacts
FOR EACH ROW EXECUTE FUNCTION prevent_completed_report_artifact_mutation();

COMMIT;
