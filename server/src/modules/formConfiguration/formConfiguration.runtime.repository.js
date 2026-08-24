import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

function getExecutor(transactionContext = null) {
    return getQueryExecutor(transactionContext);
}

const RUNTIME_FORM_QUERY = `
    SELECT
        f.id,
        f.code,
        f.name,
        f.module,
        f.description,
        f.status,
        f.is_deleted,

        a.id AS assignment_id,
        a.form_id,
        a.field_id,
        a.is_visible,
        a.is_enabled,
        a.is_editable,
        a.is_read_only,
        a.is_required,
        a.is_searchable,
        a.is_filterable,
        a.is_sortable,
        a.display_order,
        a.section,
        a.grid_size,
        a.column_width,
        a.label_override,
        a.placeholder_override,
        a.help_text_override,
        a.default_value_override,

        fd.field_key,
        fd.name AS field_name,
        fd.label AS field_label,
        fd.description AS field_description,
        fd.type AS field_type,
        fd.data_type AS field_data_type,
        fd.placeholder AS field_placeholder,
        fd.help_text AS field_help_text,
        fd.default_value AS field_default_value,
        fd.status AS field_status,
        fd.is_deleted AS field_is_deleted,
        fd.is_visible AS field_is_visible,
        fd.is_enabled AS field_is_enabled,
        fd.is_editable AS field_is_editable,
        fd.is_read_only AS field_is_read_only,
        fd.is_required AS field_is_required,
        fd.is_searchable AS field_is_searchable,
        fd.is_filterable AS field_is_filterable,
        fd.is_sortable AS field_is_sortable,
        fd.validation_config,
        fd.options_config,

        fd.storage_type,
        fd.storage_column,
        fd.storage_key,
        fd.reference_entity

    FROM form_definitions f

    INNER JOIN form_field_assignments a
        ON a.form_id = f.id

    INNER JOIN field_definitions fd
        ON fd.id = a.field_id

    WHERE
        LOWER(f.code) = LOWER($1::VARCHAR)
        AND f.status = 'active'
        AND f.is_deleted = FALSE

    ORDER BY
        a.display_order ASC,
        fd.name ASC;
`;

async function findRuntimeForm(formCode, transactionContext = null) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        RUNTIME_FORM_QUERY,
        [formCode],
    );

    if (result.rows.length === 0) {
        return null;
    }

    const first = result.rows[0];

    return {
        form: {
            id: first.id,
            code: first.code,
            name: first.name,
            module: first.module,
            description: first.description,
            status: first.status,
            is_deleted: first.is_deleted,
        },
        assignments: result.rows.map((row) => ({
            ...row,
            id: row.field_id,
        })),
    };
}

export default Object.freeze({
    findRuntimeForm,
});
