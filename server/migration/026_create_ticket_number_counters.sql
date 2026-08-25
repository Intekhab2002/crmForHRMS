/*
 * Ticket number generation
 *
 * One counter row exists per calendar year.
 * The counter is incremented atomically inside the same transaction
 * that creates the Ticket.
 */

CREATE TABLE IF NOT EXISTS ticket_number_counters (
    year INTEGER NOT NULL,
    next_number BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ticket_number_counters_pkey
        PRIMARY KEY (year),

    CONSTRAINT ticket_number_counters_year_check
        CHECK (year >= 2000),

    CONSTRAINT ticket_number_counters_next_number_check
        CHECK (next_number >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS tickets_ticket_number_unique_idx
    ON tickets (ticket_number);