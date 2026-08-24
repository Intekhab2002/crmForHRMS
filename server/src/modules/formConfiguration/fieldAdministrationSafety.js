import AppError from "../../helpers/AppError.js";

export function assertSafeFieldStructuralEdit(existing, next) {
    const structuralKeys = [
        "type",
        "dataType",
        "storageType",
        "storageColumn",
        "storageKey",
        "referenceEntity",
    ];

    const changed = structuralKeys.some((key) => {
        const nextValue = next[key] ?? null;
        const existingValue =
            key === "dataType" ? existing.data_type :
            key === "storageType" ? existing.storage_type :
            key === "storageColumn" ? existing.storage_column :
            key === "storageKey" ? existing.storage_key :
            key === "referenceEntity" ? existing.reference_entity :
            existing[key];

        return nextValue !== existingValue;
    });

    if (!changed) return;

    if (
        existing._usage?.has_form_assignments ||
        existing._usage?.has_custom_data ||
        existing._usage?.has_relational_data
    ) {
        throw AppError.conflict(
            "This field has existing form assignments or stored values. Type, data type, and storage mapping cannot be changed because doing so could invalidate existing data.",
            { code: "FORM_FIELD_DESTRUCTIVE_EDIT_BLOCKED" },
        );
    }
}
