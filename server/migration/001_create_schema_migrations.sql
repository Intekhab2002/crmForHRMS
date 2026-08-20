/**
 * ============================================================================
 * Migration: 001_create_schema_migrations
 * ============================================================================
 *
 * Purpose:
 * Creates the database migration history table.
 *
 * This migration must execute before all future application migrations.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    checksum CHAR(64) NOT NULL,

    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    execution_time_ms INTEGER NOT NULL
        CHECK (execution_time_ms >= 0)
);