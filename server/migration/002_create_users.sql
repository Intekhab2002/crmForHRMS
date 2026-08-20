/**
 * ============================================================================
 * Migration: 002_create_users
 * ============================================================================
 *
 * Purpose:
 * Creates the core authentication user table.
 *
 * Responsibilities:
 * - User identity
 * - Credential storage
 * - Account lifecycle state
 * - Login security state
 * - Password lifecycle tracking
 * - Login metadata
 *
 * Authentication sessions are intentionally stored separately in:
 *
 *     003_create_user_sessions.sql
 *
 * Roles and permissions are intentionally not included here.
 * They will be introduced by the RBAC migrations.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,

    username VARCHAR(100) NOT NULL,

    email VARCHAR(320) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    failed_login_attempts INTEGER NOT NULL DEFAULT 0
        CHECK (failed_login_attempts >= 0),

    locked_until TIMESTAMPTZ,

    email_verified_at TIMESTAMPTZ,

    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_login_at TIMESTAMPTZ,

    last_login_ip INET,

    deactivated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_status_check
        CHECK (
            status IN (
                'pending',
                'active',
                'inactive',
                'suspended',
                'locked'
            )
        )
);

/**
 * ============================================================================
 * Case-insensitive identity uniqueness
 * ============================================================================
 *
 * PostgreSQL's regular VARCHAR comparison is case-sensitive.
 *
 * Therefore:
 *
 *     User@example.com
 *     user@example.com
 *
 * must not become two different accounts.
 *
 * The same principle applies to usernames.
 * ============================================================================
 */

CREATE UNIQUE INDEX users_username_unique_idx
    ON users (LOWER(username));

CREATE UNIQUE INDEX users_email_unique_idx
    ON users (LOWER(email));

/**
 * ============================================================================
 * Authentication lookup indexes
 * ============================================================================
 */

CREATE INDEX users_status_idx
    ON users (status);

CREATE INDEX users_locked_until_idx
    ON users (locked_until)
    WHERE locked_until IS NOT NULL;

CREATE INDEX users_last_login_at_idx
    ON users (last_login_at);

/**
 * ============================================================================
 * Timestamp maintenance trigger
 * ============================================================================
 *
 * updated_at must change automatically whenever the row is updated.
 * ============================================================================
 */

CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();