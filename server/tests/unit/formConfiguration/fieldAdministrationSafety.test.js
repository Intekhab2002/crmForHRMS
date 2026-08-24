import test from "node:test";
import assert from "node:assert/strict";

import { assertSafeFieldStructuralEdit } from "../../../src/modules/formConfiguration/fieldAdministrationSafety.js";

test("allows label/behavior edits when structural metadata is unchanged", () => {
    assert.doesNotThrow(() =>
        assertSafeFieldStructuralEdit(
            {
                type: "text",
                data_type: "string",
                storage_type: "custom_data",
                storage_key: "name",
                storage_column: null,
                reference_entity: null,
                _usage: { has_form_assignments: true },
            },
            {
                label: "Changed Label",
                isRequired: true,
                type: "text",
                dataType: "string",
                storageType: "custom_data",
                storageKey: "name",
            },
        ),
    );
});

test("blocks structural edits when a field is already used", () => {
    assert.throws(
        () =>
            assertSafeFieldStructuralEdit(
                {
                    type: "text",
                    data_type: "string",
                    storage_type: "custom_data",
                    storage_key: "name",
                    _usage: { has_form_assignments: true },
                },
                {
                    type: "number",
                    dataType: "number",
                    storageType: "custom_data",
                    storageKey: "name",
                },
            ),
        (error) => error.code === "FORM_FIELD_DESTRUCTIVE_EDIT_BLOCKED",
    );
});
