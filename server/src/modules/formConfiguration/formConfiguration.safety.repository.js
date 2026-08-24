import { getQueryExecutor } from "../../database/queryExecutor.js";

function getExecutor(transactionContext = null) {
    return getQueryExecutor(transactionContext);
}

const FIND_FIELD_USAGE = `
    SELECT
        EXISTS (
            SELECT 1
            FROM form_field_assignments
            WHERE field_id = $1::UUID
        ) AS has_form_assignments,

        CASE
            WHEN $2::VARCHAR = 'custom_data'
                 AND $3::VARCHAR IS NOT NULL
            THEN EXISTS (
                SELECT 1
                FROM tickets
                WHERE custom_data ? $3::VARCHAR
            )
            ELSE FALSE
        END AS has_custom_data,

        CASE
            WHEN $2::VARCHAR = 'relational'
                 AND $4::VARCHAR IS NOT NULL
            THEN EXISTS (
                SELECT 1
                FROM tickets
                WHERE
                    CASE $4::VARCHAR
                        WHEN 'subject' THEN subject IS NOT NULL
                        WHEN 'description' THEN description IS NOT NULL
                        WHEN 'status' THEN status IS NOT NULL
                        WHEN 'department_id' THEN department_id IS NOT NULL
                        WHEN 'assigned_employee_id' THEN assigned_employee_id IS NOT NULL
                        WHEN 'created_by_user_id' THEN created_by_user_id IS NOT NULL
                        WHEN 'issue_type' THEN issue_type IS NOT NULL
                        WHEN 'priority' THEN priority IS NOT NULL
                        WHEN 'organization_id' THEN organization_id IS NOT NULL
                        WHEN 'requester_user_id' THEN requester_user_id IS NOT NULL
                        ELSE FALSE
                    END
            )
            ELSE FALSE
        END AS has_relational_data;
`;

async function findFieldUsage(fieldId, storageType, storageKey, storageColumn, transactionContext = null) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(FIND_FIELD_USAGE, [
        fieldId,
        storageType ?? null,
        storageKey ?? null,
        storageColumn ?? null,
    ]);

    return result.rows[0] ?? {
        has_form_assignments: false,
        has_custom_data: false,
        has_relational_data: false,
    };
}

export default Object.freeze({
    findFieldUsage,
});
