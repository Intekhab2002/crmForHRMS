import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

function getExecutor(transactionContext = null) {
    return getQueryExecutor(transactionContext);
}


/**
 * ============================================================================
 * FIELD QUERIES
 * ============================================================================
 */

const SELECT_FIELD_COLUMNS = `
    id,
    field_key,
    name,
    label,
    description,
    type,
    data_type,
    placeholder,
    help_text,
    default_value,
    status,
    is_deleted,
    is_visible,
    is_enabled,
    is_editable,
    is_read_only,
    is_required,
    is_searchable,
    is_filterable,
    is_sortable,
    validation_config,
    options_config,
    created_by,
    updated_by,
    deleted_by,
    created_at,
    updated_at,
    deleted_at
`;

const FIND_FIELDS = `
    SELECT
        ${SELECT_FIELD_COLUMNS}
    FROM field_definitions
    WHERE
        (
            $1::VARCHAR IS NULL
            OR field_key ILIKE '%' || $1::VARCHAR || '%'
            OR name ILIKE '%' || $1::VARCHAR || '%'
            OR label ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::VARCHAR IS NULL
            OR type = $2::VARCHAR
        )
        AND (
            $3::VARCHAR IS NULL
            OR status = $3::VARCHAR
        )
        AND (
            $4::BOOLEAN = TRUE
            OR is_deleted = FALSE
        )
    ORDER BY name ASC
    LIMIT $5::INTEGER
    OFFSET $6::INTEGER;
`;

const COUNT_FIELDS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM field_definitions
    WHERE
        (
            $1::VARCHAR IS NULL
            OR field_key ILIKE '%' || $1::VARCHAR || '%'
            OR name ILIKE '%' || $1::VARCHAR || '%'
            OR label ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::VARCHAR IS NULL
            OR type = $2::VARCHAR
        )
        AND (
            $3::VARCHAR IS NULL
            OR status = $3::VARCHAR
        )
        AND (
            $4::BOOLEAN = TRUE
            OR is_deleted = FALSE
        );
`;

const FIND_FIELD_BY_ID = `
    SELECT
        ${SELECT_FIELD_COLUMNS}
    FROM field_definitions
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_FIELD_BY_KEY = `
    SELECT
        ${SELECT_FIELD_COLUMNS}
    FROM field_definitions
    WHERE LOWER(field_key) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const INSERT_FIELD = `
    INSERT INTO field_definitions (
        field_key,
        name,
        label,
        description,
        type,
        data_type,
        placeholder,
        help_text,
        default_value,
        status,
        is_visible,
        is_enabled,
        is_editable,
        is_read_only,
        is_required,
        is_searchable,
        is_filterable,
        is_sortable,
        validation_config,
        options_config,
        created_by
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9::JSONB,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19::JSONB,
        $20::JSONB,
        $21::UUID
    )
    RETURNING
        ${SELECT_FIELD_COLUMNS};
`;

const UPDATE_FIELD = `
    UPDATE field_definitions
    SET
        name = COALESCE($2, name),
        label = COALESCE($3, label),
        description = CASE
            WHEN $4::BOOLEAN THEN $5
            ELSE description
        END,
        type = COALESCE($6, type),
        data_type = COALESCE($7, data_type),
        placeholder = CASE
            WHEN $8::BOOLEAN THEN $9
            ELSE placeholder
        END,
        help_text = CASE
            WHEN $10::BOOLEAN THEN $11
            ELSE help_text
        END,
        default_value = CASE
            WHEN $12::BOOLEAN THEN $13::JSONB
            ELSE default_value
        END,
        status = COALESCE($14, status),
        is_visible = COALESCE($15, is_visible),
        is_enabled = COALESCE($16, is_enabled),
        is_editable = COALESCE($17, is_editable),
        is_read_only = COALESCE($18, is_read_only),
        is_required = COALESCE($19, is_required),
        is_searchable = COALESCE($20, is_searchable),
        is_filterable = COALESCE($21, is_filterable),
        is_sortable = COALESCE($22, is_sortable),
        validation_config = CASE
            WHEN $23::BOOLEAN THEN $24::JSONB
            ELSE validation_config
        END,
        options_config = CASE
            WHEN $25::BOOLEAN THEN $26::JSONB
            ELSE options_config
        END,
        updated_by = $27::UUID
    WHERE id = $1::UUID
    RETURNING
        ${SELECT_FIELD_COLUMNS};
`;

const DEACTIVATE_FIELD = `
    UPDATE field_definitions
    SET
        status = 'inactive',
        is_enabled = FALSE,
        updated_by = $2::UUID
    WHERE id = $1::UUID
    RETURNING
        ${SELECT_FIELD_COLUMNS};
`;

const ACTIVATE_FIELD = `
    UPDATE field_definitions
    SET
        status = 'active',
        is_enabled = TRUE,
        updated_by = $2::UUID
    WHERE id = $1::UUID
      AND is_deleted = FALSE
    RETURNING
        ${SELECT_FIELD_COLUMNS};
`;
const RESTORE_FIELD = `
    UPDATE field_definitions
    SET
        is_deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL,
        status = 'active',
        is_enabled = TRUE,
        updated_by = $2::UUID
    WHERE id = $1::UUID
    RETURNING
        ${SELECT_FIELD_COLUMNS};
`;

const SOFT_DELETE_FIELD = `
    UPDATE field_definitions
    SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = $2::UUID,
        status = 'inactive',
        is_enabled = FALSE,
        updated_by = $2::UUID
    WHERE id = $1::UUID
    RETURNING
        ${SELECT_FIELD_COLUMNS};
`;

/**
 * ============================================================================
 * FORM DEFINITION QUERIES
 * ============================================================================
 */

const SELECT_FORM_COLUMNS = `
    id,
    code,
    name,
    module,
    description,
    status,
    is_deleted,
    created_by,
    updated_by,
    deleted_by,
    created_at,
    updated_at,
    deleted_at
`;

const FIND_FORM_BY_CODE = `
    SELECT
        ${SELECT_FORM_COLUMNS}
    FROM form_definitions
    WHERE LOWER(code) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_FORM_BY_ID = `
    SELECT
        ${SELECT_FORM_COLUMNS}
    FROM form_definitions
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_FORMS = `
    SELECT
        ${SELECT_FORM_COLUMNS}
    FROM form_definitions
    WHERE
        (
            $1::VARCHAR IS NULL
            OR code ILIKE '%' || $1::VARCHAR || '%'
            OR name ILIKE '%' || $1::VARCHAR || '%'
            OR module ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::VARCHAR IS NULL
            OR status = $2::VARCHAR
        )
        AND (
            $3::BOOLEAN = TRUE
            OR is_deleted = FALSE
        )
    ORDER BY name ASC
    LIMIT $4::INTEGER
    OFFSET $5::INTEGER;
`;

const COUNT_FORMS = `
    SELECT COUNT(*)::INTEGER AS total
    FROM form_definitions
    WHERE
        (
            $1::VARCHAR IS NULL
            OR code ILIKE '%' || $1::VARCHAR || '%'
            OR name ILIKE '%' || $1::VARCHAR || '%'
            OR module ILIKE '%' || $1::VARCHAR || '%'
        )
        AND (
            $2::VARCHAR IS NULL
            OR status = $2::VARCHAR
        )
        AND (
            $3::BOOLEAN = TRUE
            OR is_deleted = FALSE
        );
`;

const INSERT_FORM = `
    INSERT INTO form_definitions (
        code,
        name,
        module,
        description,
        status,
        created_by
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6::UUID
    )
    RETURNING
        ${SELECT_FORM_COLUMNS};
`;

const UPDATE_FORM = `
    UPDATE form_definitions
    SET
        name = COALESCE($2, name),

        module = COALESCE($3, module),

        description = CASE
            WHEN $4::BOOLEAN THEN $5
            ELSE description
        END,

        status = COALESCE($6, status),

        updated_by = $7::UUID

    WHERE id = $1::UUID

    RETURNING
        ${SELECT_FORM_COLUMNS};
`;

const DELETE_FORM = `
    UPDATE form_definitions
    SET
        is_deleted = TRUE,

        deleted_at = CURRENT_TIMESTAMP,

        deleted_by = $2::UUID,

        status = 'inactive',

        updated_by = $2::UUID

    WHERE id = $1::UUID

    RETURNING
        ${SELECT_FORM_COLUMNS};
`;


/**
 * ============================================================================
 * FORM FIELD ASSIGNMENT QUERIES
 * ============================================================================
 */

const SELECT_ASSIGNMENT_COLUMNS = `
    ffa.id,
    ffa.form_id,
    ffa.field_id,

    ffa.is_visible,
    ffa.is_enabled,
    ffa.is_editable,
    ffa.is_read_only,
    ffa.is_required,
    ffa.is_searchable,
    ffa.is_filterable,
    ffa.is_sortable,

    ffa.display_order,

    ffa.section,

    ffa.grid_size,

    ffa.column_width,

    ffa.label_override,

    ffa.placeholder_override,

    ffa.help_text_override,

    ffa.default_value_override,

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
    fd.is_visible AS field_is_visible,
    fd.is_enabled AS field_is_enabled,
    fd.is_editable AS field_is_editable,
    fd.is_read_only AS field_is_read_only,
    fd.is_required AS field_is_required,
    fd.is_searchable AS field_is_searchable,
    fd.is_filterable AS field_is_filterable,
    fd.is_sortable AS field_is_sortable,
    fd.validation_config,
    fd.options_config
`;

const FIND_FORM_ASSIGNMENTS = `
    SELECT
        ${SELECT_ASSIGNMENT_COLUMNS}
    FROM form_field_assignments ffa

    INNER JOIN field_definitions fd
        ON fd.id = ffa.field_id

    WHERE ffa.form_id = $1::UUID

    ORDER BY
        ffa.display_order ASC,
        fd.name ASC;
`;

const FIND_ASSIGNMENT = `
    SELECT
        ${SELECT_ASSIGNMENT_COLUMNS}
    FROM form_field_assignments ffa

    INNER JOIN field_definitions fd
        ON fd.id = ffa.field_id

    WHERE
        ffa.form_id = $1::UUID
        AND ffa.field_id = $2::UUID

    LIMIT 1;
`;

const INSERT_ASSIGNMENT = `
    INSERT INTO form_field_assignments (
        form_id,
        field_id,

        is_visible,
        is_enabled,
        is_editable,
        is_read_only,
        is_required,
        is_searchable,
        is_filterable,
        is_sortable,

        display_order,

        section,

        grid_size,

        column_width,

        label_override,

        placeholder_override,

        help_text_override,

        default_value_override,

        created_by
    )
    VALUES (
        $1::UUID,
        $2::UUID,

        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,

        $11,

        $12,

        $13,

        $14,

        $15,

        $16,

        $17,

        $18::JSONB,

        $19::UUID
    )

    RETURNING id;
`;

const DELETE_ASSIGNMENT = `
    DELETE FROM form_field_assignments
    WHERE
        form_id = $1::UUID
        AND field_id = $2::UUID

    RETURNING id;
`;

const UPDATE_ASSIGNMENT = `
    UPDATE form_field_assignments
    SET
        is_visible = $3,
        is_enabled = $4,
        is_editable = $5,
        is_read_only = $6,
        is_required = $7,
        is_searchable = $8,
        is_filterable = $9,
        is_sortable = $10,

        display_order = $11,
        section = $12,
        grid_size = $13,
        column_width = $14,

        label_override = $15,
        placeholder_override = $16,
        help_text_override = $17,
        default_value_override = $18::JSONB,

        updated_by = $19::UUID
    WHERE
        form_id = $1::UUID
        AND field_id = $2::UUID
    RETURNING id;
`;


/**
 * ============================================================================
 * FIELD METHODS
 * ============================================================================
 */

async function findFields(
    filters,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const values = [
        filters.search ?? null,
        filters.type ?? null,
        filters.status ?? null,
        filters.includeDeleted ?? false,
    ];

    const [rowsResult, countResult] =
        await Promise.all([
            executor.query(
                FIND_FIELDS,
                [
                    ...values,
                    filters.limit,
                    filters.offset,
                ],
            ),

            executor.query(
                COUNT_FIELDS,
                values,
            ),
        ]);

    return {
        rows: rowsResult.rows,
        total: countResult.rows[0]?.total ?? 0,
    };
}

async function findFieldById(
    fieldId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result = await executor.query(
        FIND_FIELD_BY_ID,
        [fieldId],
    );

    return result.rows[0] ?? null;
}

async function findFieldByKey(
    fieldKey,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result = await executor.query(
        FIND_FIELD_BY_KEY,
        [fieldKey],
    );

    return result.rows[0] ?? null;
}

async function createField(
    data,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result = await executor.query(
        INSERT_FIELD,
        [
            data.fieldKey,
            data.name,
            data.label,
            data.description ?? null,
            data.type,
            data.dataType,
            data.placeholder ?? null,
            data.helpText ?? null,
            JSON.stringify(data.defaultValue ?? null),
            data.status ?? "active",
            data.isVisible ?? true,
            data.isEnabled ?? true,
            data.isEditable ?? true,
            data.isReadOnly ?? false,
            data.isRequired ?? false,
            data.isSearchable ?? false,
            data.isFilterable ?? false,
            data.isSortable ?? false,
            JSON.stringify(data.validationConfig ?? {}),
            JSON.stringify(data.optionsConfig ?? {}),
            actorId,
        ],
    );

    return result.rows[0] ?? null;
}

async function updateField(
    fieldId,
    data,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const has = (key) =>
        Object.prototype.hasOwnProperty.call(
            data,
            key,
        );

    const result = await executor.query(
        UPDATE_FIELD,
        [
            fieldId,

            data.name ?? null,
            data.label ?? null,

            has("description"),
            data.description ?? null,

            data.type ?? null,
            data.dataType ?? null,

            has("placeholder"),
            data.placeholder ?? null,

            has("helpText"),
            data.helpText ?? null,

            has("defaultValue"),
            JSON.stringify(data.defaultValue ?? null),

            data.status ?? null,

            data.isVisible ?? null,
            data.isEnabled ?? null,
            data.isEditable ?? null,
            data.isReadOnly ?? null,
            data.isRequired ?? null,
            data.isSearchable ?? null,
            data.isFilterable ?? null,
            data.isSortable ?? null,

            has("validationConfig"),
            JSON.stringify(
                data.validationConfig ?? {},
            ),

            has("optionsConfig"),
            JSON.stringify(
                data.optionsConfig ?? {},
            ),

            actorId,
        ],
    );

    return result.rows[0] ?? null;
}

async function deactivateField(
    fieldId,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result = await executor.query(
        DEACTIVATE_FIELD,
        [
            fieldId,
            actorId,
        ],
    );

    return result.rows[0] ?? null;
}


async function activateField(
    fieldId,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            ACTIVATE_FIELD,
            [
                fieldId,
                actorId,
            ],
        );

    return result.rows[0] ?? null;
}

async function softDeleteField(
    fieldId,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result = await executor.query(
        SOFT_DELETE_FIELD,
        [
            fieldId,
            actorId,
        ],
    );

    return result.rows[0] ?? null;
}

async function restoreField(
    fieldId,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result = await executor.query(
        RESTORE_FIELD,
        [
            fieldId,
            actorId,
        ],
    );

    return result.rows[0] ?? null;
}


async function findForms(
    filters,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const values = [
        filters.search ?? null,
        filters.status ?? null,
        filters.includeDeleted ?? false,
    ];

    const [
        rowsResult,
        countResult,
    ] = await Promise.all([
        executor.query(
            FIND_FORMS,
            [
                ...values,
                filters.limit,
                filters.offset,
            ],
        ),

        executor.query(
            COUNT_FORMS,
            values,
        ),
    ]);

    return {
        rows: rowsResult.rows,
        total: countResult.rows[0]?.total ?? 0,
    };
}


async function findFormById(
    formId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            FIND_FORM_BY_ID,
            [formId],
        );

    return result.rows[0] ?? null;
}


async function findFormByCode(
    code,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            FIND_FORM_BY_CODE,
            [code],
        );

    return result.rows[0] ?? null;
}


async function createForm(
    data,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            INSERT_FORM,
            [
                data.code,
                data.name,
                data.module,
                data.description ?? null,
                data.status ?? "active",
                actorId,
            ],
        );

    return result.rows[0] ?? null;
}


async function updateForm(
    formId,
    data,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const has =
        (key) =>
            Object.prototype.hasOwnProperty.call(
                data,
                key,
            );

    const result =
        await executor.query(
            UPDATE_FORM,
            [
                formId,

                data.name ?? null,

                data.module ?? null,

                has("description"),

                data.description ?? null,

                data.status ?? null,

                actorId,
            ],
        );

    return result.rows[0] ?? null;
}


async function deleteForm(
    formId,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            DELETE_FORM,
            [
                formId,
                actorId,
            ],
        );

    return result.rows[0] ?? null;
}


async function findFormAssignments(
    formId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            FIND_FORM_ASSIGNMENTS,
            [formId],
        );

    return result.rows;
}


async function findAssignment(
    formId,
    fieldId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            FIND_ASSIGNMENT,
            [
                formId,
                fieldId,
            ],
        );

    return result.rows[0] ?? null;
}


async function createAssignment(
    data,
    actorId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            INSERT_ASSIGNMENT,
            [
                data.formId,
                data.fieldId,

                data.isVisible ?? null,
                data.isEnabled ?? null,
                data.isEditable ?? null,
                data.isReadOnly ?? null,
                data.isRequired ?? null,
                data.isSearchable ?? null,
                data.isFilterable ?? null,
                data.isSortable ?? null,

                data.displayOrder ?? 0,

                data.section ?? null,

                data.gridSize ?? null,

                data.columnWidth ?? null,

                data.labelOverride ?? null,

                data.placeholderOverride ?? null,

                data.helpTextOverride ?? null,

                JSON.stringify(
                    data.defaultValueOverride ?? null,
                ),

                actorId,
            ],
        );

    return result.rows[0] ?? null;
}


async function deleteAssignment(
    formId,
    fieldId,
    transactionContext = null,
) {
    const executor =
        getExecutor(transactionContext);

    const result =
        await executor.query(
            DELETE_ASSIGNMENT,
            [
                formId,
                fieldId,
            ],
        );

    return result.rows[0] ?? null;
}

async function updateAssignment(
    formId,
    fieldId,
    data,
    actorId,
    transactionContext = null,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        UPDATE_ASSIGNMENT,
        [
            formId,
            fieldId,

            data.isVisible ?? null,
            data.isEnabled ?? null,
            data.isEditable ?? null,
            data.isReadOnly ?? null,
            data.isRequired ?? null,
            data.isSearchable ?? null,
            data.isFilterable ?? null,
            data.isSortable ?? null,

            data.displayOrder ?? 0,
            data.section ?? null,
            data.gridSize ?? null,
            data.columnWidth ?? null,

            data.labelOverride ?? null,
            data.placeholderOverride ?? null,
            data.helpTextOverride ?? null,

            JSON.stringify(
                data.defaultValueOverride ?? null,
            ),

            actorId,
        ],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findFields,
    findFieldById,
    findFieldByKey,
    createField,
    updateField,
    deactivateField,
    activateField,
    softDeleteField,
    restoreField,

        // Forms
    findForms,
    findFormById,
    findFormByCode,
    createForm,
    updateForm,
    deleteForm,

    // Assignments
    findFormAssignments,
    findAssignment,
    createAssignment,
    deleteAssignment,
    updateAssignment,
});