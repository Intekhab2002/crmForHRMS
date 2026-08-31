-- ============================================================================
-- Migration: 013_create_ticket_number_counters
-- Purpose  : Per-year counter table for human-readable ticket numbers.
--            One row per calendar year; incremented atomically inside the
--            same transaction that creates the ticket.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_number_counters (
    year        INTEGER     NOT NULL,
    next_number BIGINT      NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_number_counters_pkey
        PRIMARY KEY (year),

    CONSTRAINT ticket_number_counters_year_check
        CHECK (year >= 2000),

    CONSTRAINT ticket_number_counters_next_number_check
        CHECK (next_number >= 1)
);
