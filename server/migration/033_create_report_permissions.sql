BEGIN;

INSERT INTO permissions (
    id, code, name, description, resource, action, is_system, is_active
)
VALUES
(gen_random_uuid(),'reports:read','View Reports','View report definitions, generated report history and run details.','reports','read',TRUE,TRUE),
(gen_random_uuid(),'reports:generate','Generate Reports','Preview and generate finalized report artifacts.','reports','generate',TRUE,TRUE),
(gen_random_uuid(),'reports:download','Download Reports','Download finalized report artifacts.','reports','download',TRUE,TRUE)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    is_system = TRUE,
    is_active = TRUE;

COMMIT;
