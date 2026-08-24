import assert from "node:assert/strict";
import test from "node:test";

import compatibility from "../../../src/modules/formConfiguration/engines/fieldCompatibility.js";
import metadata from "../../../src/modules/formConfiguration/engines/fieldMetadata.engine.js";
import validation from "../../../src/modules/formConfiguration/engines/fieldValidation.engine.js";
import storage from "../../../src/modules/formConfiguration/engines/fieldStorage.engine.js";
import runtime from "../../../src/modules/formConfiguration/engines/runtimeForm.engine.js";
import changes from "../../../src/modules/formConfiguration/engines/fieldChange.engine.js";

const baseField = {
    field_id: "1",
    field_key: "service_type",
    field_name: "Service Type",
    field_label: "Service Type",
    field_type: "select",
    field_data_type: "string",
    field_status: "active",
    field_is_deleted: false,
    field_is_visible: true,
    field_is_enabled: true,
    field_is_editable: true,
    field_is_read_only: false,
    field_is_required: false,
    field_is_searchable: false,
    field_is_filterable: false,
    field_is_sortable: false,
    validation_config: {},
    options_config: {
        static: [
            { label: "Miscellaneous", value: "Miscellaneous" },
            { label: "General Information", value: "General Information" },
        ],
    },
    storage_type: "custom_data",
    storage_key: "service_type",
};

test("field compatibility accepts select/string", () => {
    assert.doesNotThrow(() => {
        compatibility.assertTypeDataTypeCompatibility("select", "string");
    });
});

test("field compatibility rejects invalid type/dataType pair", () => {
    assert.throws(
        () => compatibility.assertTypeDataTypeCompatibility("date", "string"),
        /incompatible/i,
    );
});

test("metadata engine resolves assignment overrides", () => {
    const [field] = metadata.resolveRuntimeFields([{
        ...baseField,
        is_visible: true,
        is_enabled: true,
        is_editable: true,
        is_read_only: false,
        is_required: false,
        label_override: "Service",
        display_order: 3,
        section: "classification",
    }]);

    assert.equal(field.key, "service_type");
    assert.equal(field.label, "Service");
    assert.equal(field.order, 3);
    assert.equal(field.section, "classification");
    assert.equal(field.visible, true);
});

test("runtime engine excludes storage internals by default", () => {
    const form = runtime.buildRuntimeForm(
        {
            id: "form-1",
            code: "ticket.create",
            name: "Create Ticket",
            module: "ticket",
            status: "active",
        },
        [baseField],
    );

    assert.equal(form.fields[0].key, "service_type");
    assert.equal("storageType" in form.fields[0], false);
});

test("validation engine rejects unknown and invalid option values", () => {
    const fields = runtime.buildRuntimeForm(
        {
            id: "form-1",
            code: "ticket.create",
            name: "Create Ticket",
            module: "ticket",
            status: "active",
        },
        [baseField],
    ).fields;

    assert.throws(
        () => validation.validateDynamicPayload(
            fields,
            { service_type: "NotAllowed" },
        ),
        /validation failed/i,
    );

    assert.throws(
        () => validation.validateDynamicPayload(
            fields,
            { unknown_field: "x" },
        ),
        /validation failed/i,
    );
});

test("storage engine splits custom data without changing the value", () => {
    const fields = runtime.buildRuntimeForm(
        {
            id: "form-1",
            code: "ticket.create",
            name: "Create Ticket",
            module: "ticket",
            status: "active",
        },
        [baseField],
        { includeStorage: true },
    ).fields;

    const result = storage.splitDynamicPayload(
        fields,
        { service_type: "Miscellaneous" },
    );

    assert.deepEqual(result.customData, {
        service_type: "Miscellaneous",
    });
});

test("field change engine uses stable field keys", () => {
    const fields = [{
        key: "service_type",
        label: "Service Type",
    }];

    const result = changes.collectFieldChanges(
        fields,
        { service_type: "Miscellaneous" },
        { service_type: "General Information" },
    );

    assert.deepEqual(result, [{
        fieldKey: "service_type",
        label: "Service Type",
        oldValue: "Miscellaneous",
        newValue: "General Information",
    }]);
});
