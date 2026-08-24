import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

function getExecutor(transactionContext = null) {
    return getQueryExecutor(transactionContext);
}

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
    storage_type,
    storage_column,
    storage_key,
    reference_entity,
    created_by,
    updated_by,
    deleted_by,
    created_at,
    updated_at,
    deleted_at
`;

const FIND_FIELD_BY_ID = `
    SELECT ${SELECT_FIELD_COLUMNS}
    FROM field_definitions
    WHERE id = $1::UUID
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
        storage_type,
        storage_column,
        storage_key,
        reference_entity,
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
        $21,
        $22,
        $23,
        $24,
        $25::UUID
    )
    RETURNING ${SELECT_FIELD_COLUMNS};
`;

const UPDATE_FIELD = `
    UPDATE field_definitions
    SET
        name = COALESCE($2, name),
        label = COALESCE($3, label),
        description = CASE WHEN $4::BOOLEAN THEN $5 ELSE description END,
        type = COALESCE($6, type),
        data_type = COALESCE($7, data_type),
        placeholder = CASE WHEN $8::BOOLEAN THEN $9 ELSE placeholder END,
        help_text = CASE WHEN $10::BOOLEAN THEN $11 ELSE help_text END,
        default_value = CASE WHEN $12::BOOLEAN THEN $13::JSONB ELSE default_value END,
        status = COALESCE($14, status),
        is_visible = COALESCE($15, is_visible),
        is_enabled = COALESCE($16, is_enabled),
        is_editable = COALESCE($17, is_editable),
        is_read_only = COALESCE($18, is_read_only),
        is_required = COALESCE($19, is_required),
        is_searchable = COALESCE($20, is_searchable),
        is_filterable = COALESCE($21, is_filterable),
        is_sortable = COALESCE($22, is_sortable),
        validation_config = CASE WHEN $23::BOOLEAN THEN $24::JSONB ELSE validation_config END,
        options_config = CASE WHEN $25::BOOLEAN THEN $26::JSONB ELSE options_config END,
        storage_type = CASE WHEN $27::BOOLEAN THEN $28 ELSE storage_type END,
        storage_column = CASE WHEN $29::BOOLEAN THEN $30 ELSE storage_column END,
        storage_key = CASE WHEN $31::BOOLEAN THEN $32 ELSE storage_key END,
        reference_entity = CASE WHEN $33::BOOLEAN THEN $34 ELSE reference_entity END,
        updated_by = $35::UUID
    WHERE id = $1::UUID
    RETURNING ${SELECT_FIELD_COLUMNS};
`;

async function findFieldById(fieldId, transactionContext = null) {
    const executor = getExecutor(transactionContext);
    const result = await executor.query(FIND_FIELD_BY_ID, [fieldId]);
    return result.rows[0] ?? null;
}

async function createField(data, actorId, transactionContext = null) {
    const executor = getExecutor(transactionContext);

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
            data.storageType ?? null,
            data.storageColumn ?? null,
            data.storageKey ?? null,
            data.referenceEntity ?? null,
            actorId,
        ],
    );

    return result.rows[0] ?? null;
}

async function updateField(fieldId, data, actorId, transactionContext = null) {
    const executor = getExecutor(transactionContext);
    const has = (key) => Object.prototype.hasOwnProperty.call(data, key);

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
            JSON.stringify(data.validationConfig ?? {}),
            has("optionsConfig"),
            JSON.stringify(data.optionsConfig ?? {}),
            has("storageType"),
            data.storageType ?? null,
            has("storageColumn"),
            data.storageColumn ?? null,
            has("storageKey"),
            data.storageKey ?? null,
            has("referenceEntity"),
            data.referenceEntity ?? null,
            actorId,
        ],
    );

    return result.rows[0] ?? null;
}

export default Object.freeze({
    findFieldById,
    createField,
    updateField,
});
