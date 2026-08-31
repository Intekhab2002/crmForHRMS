-- ============================================================================
-- Migration: 003_create_user_sessions
-- Purpose  : Persistent authentication session storage.
--            Raw refresh tokens are never stored — only their SHA-256 hash.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id                   UUID        PRIMARY KEY,
    user_id              UUID        NOT NULL,
    refresh_token_hash   VARCHAR(64) NOT NULL,
    expires_at           TIMESTAMPTZ NOT NULL,
    revoked_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at         TIMESTAMPTZ,
    ip_address           INET,
    user_agent           TEXT,

    CONSTRAINT user_sessions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT user_sessions_refresh_token_hash_unique
        UNIQUE (refresh_token_hash)
);

CREATE INDEX user_sessions_user_id_idx    ON user_sessions (user_id);
CREATE INDEX user_sessions_expires_at_idx ON user_sessions (expires_at);
CREATE INDEX user_sessions_revoked_at_idx ON user_sessions (revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX user_sessions_active_user_idx ON user_sessions (user_id)   WHERE revoked_at IS NULL;
