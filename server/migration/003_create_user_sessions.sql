/**
 * ============================================================================
 * Migration: 003_create_user_sessions
 * ============================================================================
 *
 * Purpose:
 * Creates persistent authentication session storage.
 *
 * Security model:
 * - Raw refresh tokens are NEVER stored.
 * - Only a cryptographic hash of the refresh token is persisted.
 * - Sessions can be revoked independently.
 * - Expired sessions remain auditable until cleanup.
 * - A user can have multiple historical sessions, but the application
 *   authentication policy will maintain one active session per user.
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    refresh_token_hash VARCHAR(64) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_used_at TIMESTAMPTZ,

    ip_address INET,

    user_agent TEXT,

    CONSTRAINT user_sessions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT user_sessions_refresh_token_hash_unique
        UNIQUE (refresh_token_hash)
);

/**
 * ============================================================================
 * Authentication lookup indexes
 * ============================================================================
 */

CREATE INDEX user_sessions_user_id_idx
    ON user_sessions (user_id);

CREATE INDEX user_sessions_expires_at_idx
    ON user_sessions (expires_at);

CREATE INDEX user_sessions_revoked_at_idx
    ON user_sessions (revoked_at)
    WHERE revoked_at IS NOT NULL;

/**
 * ============================================================================
 * Active-session lookup
 * ============================================================================
 *
 * This index supports:
 *
 *     WHERE user_id = ?
 *       AND revoked_at IS NULL
 *       AND expires_at > CURRENT_TIMESTAMP
 *
 * PostgreSQL does not allow CURRENT_TIMESTAMP in an index predicate because
 * it is not immutable, so expiration is intentionally not part of the
 * predicate.
 * ============================================================================
 */

CREATE INDEX user_sessions_active_user_idx
    ON user_sessions (user_id)
    WHERE revoked_at IS NULL;