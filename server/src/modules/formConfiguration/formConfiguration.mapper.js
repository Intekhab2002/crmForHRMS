function mapFieldToApi(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,

        fieldKey: row.field_key,

        name: row.name,

        label: row.label,

        description: row.description,

        type: row.type,

        dataType: row.data_type,

        placeholder: row.placeholder,

        helpText: row.help_text,

        defaultValue: row.default_value,

        status: row.status,

        isDeleted: row.is_deleted,

        isVisible: row.is_visible,

        isEnabled: row.is_enabled,

        isEditable: row.is_editable,

        isReadOnly: row.is_read_only,

        isRequired: row.is_required,

        isSearchable: row.is_searchable,

        isFilterable: row.is_filterable,

        isSortable: row.is_sortable,

        validationConfig:
            row.validation_config ?? {},

        optionsConfig:
            row.options_config ?? {},

        createdBy: row.created_by,

        updatedBy: row.updated_by,

        deletedBy: row.deleted_by,

        createdAt: row.created_at,

        updatedAt: row.updated_at,

        deletedAt: row.deleted_at,
    };
}

function mapFormToApi(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,

        code: row.code,

        name: row.name,

        module: row.module,

        description: row.description,

        status: row.status,

        isDeleted: row.is_deleted,

        createdAt: row.created_at,

        updatedAt: row.updated_at,

        deletedAt: row.deleted_at,
    };
}

function mapAssignmentToApi(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,

        formId: row.form_id,

        fieldId: row.field_id,

        fieldKey: row.field_key,

        displayOrder:
            row.display_order,

        section:
            row.section,

        gridSize:
            row.grid_size,

        columnWidth:
            row.column_width,

        isVisible:
            row.is_visible,

        isEnabled:
            row.is_enabled,

        isEditable:
            row.is_editable,

        isReadOnly:
            row.is_read_only,

        isRequired:
            row.is_required,

        isSearchable:
            row.is_searchable,

        isFilterable:
            row.is_filterable,

        isSortable:
            row.is_sortable,

        labelOverride:
            row.label_override,

        placeholderOverride:
            row.placeholder_override,

        helpTextOverride:
            row.help_text_override,

        defaultValueOverride:
            row.default_value_override,
    };
}

function mapAssignmentToRuntimeField(row) {
    return {
        id: row.field_id,

        key: row.field_key,

        name: row.field_name,

        label:
            row.label_override ??
            row.field_label,

        description:
            row.field_description,

        type:
            row.field_type,

        dataType:
            row.field_data_type,

        placeholder:
            row.placeholder_override ??
            row.field_placeholder,

        helpText:
            row.help_text_override ??
            row.field_help_text,

        defaultValue:
            row.default_value_override ??
            row.field_default_value,

        /**
         * Assignment override wins.
         * Otherwise use the field default.
         */
        visible:
            row.is_visible ??
            row.field_is_visible,

        enabled:
            row.is_enabled ??
            row.field_is_enabled,

        editable:
            row.is_editable ??
            row.field_is_editable,

        readOnly:
            row.is_read_only ??
            row.field_is_read_only,

        required:
            row.is_required ??
            row.field_is_required,

        searchable:
            row.is_searchable ??
            row.field_is_searchable,

        filterable:
            row.is_filterable ??
            row.field_is_filterable,

        sortable:
            row.is_sortable ??
            row.field_is_sortable,

        order:
            row.display_order,

        section:
            row.section,

        gridSize:
            row.grid_size,

        columnWidth:
            row.column_width,

        validation:
            row.validation_config ?? {},

        options:
            row.options_config ?? {},
    };
}


function mapRuntimeForm(
    form,
    assignments,
) {
    return {
        id: form.id,

        code: form.code,

        name: form.name,

        module: form.module,

        description: form.description,

        status: form.status,

        fields: assignments.map(
            mapAssignmentToRuntimeField,
        ),
    };
}

export default Object.freeze({
    mapFieldToApi,
    mapFormToApi,
    mapAssignmentToRuntimeField,
    mapRuntimeForm,
    mapAssignmentToApi
});