/**
 * Metadata resolution engine.
 *
 * Converts database field + assignment rows into one authoritative,
 * renderer-safe runtime field model. This module contains no SQL.
 */
import AppError from "../../../helpers/AppError.js";

import compatibility from "./fieldCompatibility.js";

function valueOrDefault(override, fallback) {
    return override === null || override === undefined
        ? fallback
        : override;
}

function normalizeFieldRow(row) {
    const field = {
        id: row.field_id ?? row.id,
        fieldKey: row.field_key,
        name: row.field_name ?? row.name,
        label: row.field_label ?? row.label,
        description: row.field_description ?? row.description ?? null,
        type: row.field_type ?? row.type,
        dataType: row.field_data_type ?? row.data_type,
        placeholder: row.field_placeholder ?? row.placeholder ?? null,
        helpText: row.field_help_text ?? row.help_text ?? null,
        defaultValue: row.field_default_value ?? row.default_value ?? null,
        status: row.field_status ?? row.status,
        isDeleted: row.field_is_deleted ?? row.is_deleted ?? false,
        isVisible: row.field_is_visible ?? row.is_visible ?? true,
        isEnabled: row.field_is_enabled ?? row.is_enabled ?? true,
        isEditable: row.field_is_editable ?? row.is_editable ?? true,
        isReadOnly: row.field_is_read_only ?? row.is_read_only ?? false,
        isRequired: row.field_is_required ?? row.is_required ?? false,
        isSearchable: row.field_is_searchable ?? row.is_searchable ?? false,
        isFilterable: row.field_is_filterable ?? row.is_filterable ?? false,
        isSortable: row.field_is_sortable ?? row.is_sortable ?? false,
        validationConfig: row.validation_config ?? {},
        optionsConfig: row.options_config ?? {},
        storageType: row.storage_type ?? null,
        storageColumn: row.storage_column ?? null,
        storageKey: row.storage_key ?? null,
        referenceEntity: row.reference_entity ?? null,
    };

    compatibility.assertFieldDefinitionCompatibility(field);

    if (!field.storageType) {
        throw AppError.conflict(
            `Field '${field.fieldKey}' has no storage mapping.`,
            { code: "FORM_FIELD_STORAGE_MAPPING_MISSING" },
        );
    }

    return field;
}

function resolveAssignment(field, assignment) {
    const resolved = {
        ...field,

        visible: valueOrDefault(assignment.is_visible, field.isVisible),
        enabled: valueOrDefault(assignment.is_enabled, field.isEnabled),
        editable: valueOrDefault(assignment.is_editable, field.isEditable),
        readOnly: valueOrDefault(assignment.is_read_only, field.isReadOnly),
        required: valueOrDefault(assignment.is_required, field.isRequired),
        searchable: valueOrDefault(assignment.is_searchable, field.isSearchable),
        filterable: valueOrDefault(assignment.is_filterable, field.isFilterable),
        sortable: valueOrDefault(assignment.is_sortable, field.isSortable),

        label: valueOrDefault(
            assignment.label_override,
            field.label,
        ),
        placeholder: valueOrDefault(
            assignment.placeholder_override,
            field.placeholder,
        ),
        helpText: valueOrDefault(
            assignment.help_text_override,
            field.helpText,
        ),
        defaultValue: valueOrDefault(
            assignment.default_value_override,
            field.defaultValue,
        ),

        order: assignment.display_order ?? 0,
        section: assignment.section ?? null,
        gridSize: assignment.grid_size ?? null,
        columnWidth: assignment.column_width ?? null,
    };

    if (resolved.isDeleted || resolved.status !== "active") {
        throw AppError.conflict(
            `Field '${resolved.fieldKey}' cannot be used because it is inactive or deleted.`,
            { code: "FORM_FIELD_NOT_RUNTIME_ACTIVE" },
        );
    }

    return resolved;
}

function toRuntimeField(field, { includeStorage = false } = {}) {
    return {
        id: field.id,
        key: field.fieldKey,
        name: field.name,
        label: field.label,
        description: field.description,
        type: field.type,
        dataType: field.dataType,
        placeholder: field.placeholder,
        helpText: field.helpText,
        defaultValue: field.defaultValue,

        visible: field.visible,
        enabled: field.enabled,
        editable: field.editable,
        readOnly: field.readOnly,
        required: field.required,
        searchable: field.searchable,
        filterable: field.filterable,
        sortable: field.sortable,

        order: field.order,
        section: field.section,
        gridSize: field.gridSize,
        columnWidth: field.columnWidth,

        validation: field.validationConfig ?? {},
        options: field.optionsConfig ?? {},

        ...(includeStorage ? {
            storageType: field.storageType,
            storageColumn: field.storageColumn,
            storageKey: field.storageKey,
            referenceEntity: field.referenceEntity,
        } : {}),
    };
}

function resolveRuntimeFields(assignments, { includeStorage = false } = {}) {
    const seen = new Set();

    return assignments
        .map((assignment) => {
            const field = normalizeFieldRow(assignment);
            const resolved = resolveAssignment(field, assignment);

            if (seen.has(resolved.fieldKey)) {
                throw AppError.conflict(
                    `Duplicate field '${resolved.fieldKey}' is assigned to the runtime form.`,
                    { code: "FORM_RUNTIME_DUPLICATE_FIELD" },
                );
            }

            seen.add(resolved.fieldKey);

            return toRuntimeField(resolved, { includeStorage });
        })
        .sort((a, b) => a.order - b.order);
}

function assertWritableField(field, fieldKey) {
    if (!field) {
        throw AppError.validation(
            "Unknown dynamic field.",
            [{ path: fieldKey, message: `Field '${fieldKey}' is not part of this form.` }],
            { code: "FORM_DYNAMIC_FIELD_UNKNOWN" },
        );
    }

    if (!field.enabled || field.readOnly || !field.editable) {
        throw AppError.forbidden(
            `Field '${fieldKey}' cannot be written in this form.`,
            { code: "FORM_DYNAMIC_FIELD_NOT_WRITABLE" },
        );
    }
}

export default Object.freeze({
    normalizeFieldRow,
    resolveRuntimeFields,
    assertWritableField,
});
