CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_type varchar(50) NOT NULL,
    layout_version integer NOT NULL,
    layout_json jsonb NOT NULL DEFAULT '{"version":1,"widgets":[]}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_dashboard_layouts_dashboard_type_ck
        CHECK (dashboard_type IN ('operational', 'management', 'professional', 'executive', 'audit')),
    CONSTRAINT user_dashboard_layouts_version_ck
        CHECK (layout_version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_dashboard_layouts_user_type_uk
    ON user_dashboard_layouts (user_id, dashboard_type);

CREATE INDEX IF NOT EXISTS user_dashboard_layouts_user_idx
    ON user_dashboard_layouts (user_id);

CREATE INDEX IF NOT EXISTS user_dashboard_layouts_dashboard_type_idx
    ON user_dashboard_layouts (dashboard_type);

CREATE OR REPLACE FUNCTION set_user_dashboard_layouts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_dashboard_layouts_updated_at
    ON user_dashboard_layouts;

CREATE TRIGGER trg_user_dashboard_layouts_updated_at
BEFORE UPDATE ON user_dashboard_layouts
FOR EACH ROW
EXECUTE FUNCTION set_user_dashboard_layouts_updated_at();
