-- ============================================================================
-- Migration: 001_create_schema_migrations
-- Purpose  : Migration history tracking table.
--            Must run before every other migration.
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version          VARCHAR(255) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    checksum         CHAR(64)     NOT NULL,
    applied_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER      NOT NULL,

    CONSTRAINT schema_migrations_pkey
        PRIMARY KEY (version),

    CONSTRAINT schema_migrations_execution_time_ms_check
        CHECK (execution_time_ms >= 0)
);
