/**
 * Storage mapping engine.
 *
 * Splits validated metadata-defined values into explicit persistence buckets.
 * It never generates ALTER TABLE statements.
 */
import AppError from "../../../helpers/AppError.js";

function splitDynamicPayload(fields, payload) {
    const fieldMap = new Map(fields.map((field) => [field.key, field]));
    const relational = {};
    const customData = {};
    const references = {};
    const specialized = {};

    for (const [fieldKey, value] of Object.entries(payload ?? {})) {
        const field = fieldMap.get(fieldKey);

        if (!field) {
            throw AppError.validation(
                "Unknown dynamic field.",
                [{ path: fieldKey, message: `Field '${fieldKey}' is not defined for this form.` }],
                { code: "FORM_DYNAMIC_FIELD_UNKNOWN" },
            );
        }

        switch (field.storageType) {
            case "relational":
                relational[field.storageColumn] = value;
                break;

            case "custom_data":
                customData[field.storageKey] = value;
                break;

            case "reference":
                references[field.referenceEntity] = value;
                break;

            case "specialized":
                specialized[field.storageKey] = value;
                break;

            default:
                throw AppError.conflict(
                    `Field '${fieldKey}' has no valid storage mapping.`,
                    { code: "FORM_FIELD_STORAGE_MAPPING_MISSING" },
                );
        }
    }

    return {
        relational,
        customData,
        references,
        specialized,
    };
}

function mergeCustomData(existing, nextValues) {
    const current = existing && typeof existing === "object" && !Array.isArray(existing)
        ? existing
        : {};

    return {
        ...current,
        ...nextValues,
    };
}

function extractDynamicPayload(fields, ticketRow) {
    const payload = {};
    const customData = ticketRow?.custom_data ?? ticketRow?.customData ?? {};

    for (const field of fields) {
        if (field.storageType === "custom_data") {
            if (Object.prototype.hasOwnProperty.call(customData, field.storageKey)) {
                payload[field.key] = customData[field.storageKey];
            }
        } else if (field.storageType === "relational") {
            if (Object.prototype.hasOwnProperty.call(ticketRow, field.storageColumn)) {
                payload[field.key] = ticketRow[field.storageColumn];
            }
        }
    }

    return payload;
}

export default Object.freeze({
    splitDynamicPayload,
    mergeCustomData,
    extractDynamicPayload,
});
