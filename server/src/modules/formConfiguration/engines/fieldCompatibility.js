/**
 * Canonical field/type/storage compatibility registry.
 * No database code belongs here.
 */
import AppError from "../../../helpers/AppError.js";

import { FIELD_TYPES, FIELD_DATA_TYPES, STORAGE_TYPES } from "../formConfiguration.constants.js";

const TYPE_DATA_TYPES = Object.freeze({
    text: ["string"], textarea: ["string"], number: ["number"], email: ["string"], password: ["string"],
    select: ["string", "number"], multi_select: ["array"], autocomplete: ["string", "number"],
    date: ["date"], datetime: ["datetime"], time: ["time"], checkbox: ["boolean"], switch: ["boolean"],
    radio: ["string", "number"], file: ["file"],
});
const STORAGE_KEYS = new Set(STORAGE_TYPES);

function assertKnownFieldType(type) {
    if (!FIELD_TYPES.includes(type)) throw AppError.validation("Unsupported field type.", [{ path: "type", message: `Unsupported field type: ${type}.` }], { code: "FORM_FIELD_INVALID_TYPE" });
}
function assertKnownDataType(dataType) {
    if (!FIELD_DATA_TYPES.includes(dataType)) throw AppError.validation("Unsupported field data type.", [{ path: "dataType", message: `Unsupported field data type: ${dataType}.` }], { code: "FORM_FIELD_INVALID_DATA_TYPE" });
}
function assertTypeDataTypeCompatibility(type, dataType) {
    assertKnownFieldType(type); assertKnownDataType(dataType);
    const allowed=TYPE_DATA_TYPES[type]??[];
    if (!allowed.includes(dataType)) throw AppError.validation("Field type and data type are incompatible.", [{ path:"dataType", message:`${type} requires one of: ${allowed.join(", ")}.` }], { code:"FORM_FIELD_TYPE_DATA_TYPE_MISMATCH" });
}
function normalizeStorageMapping(field) {
    const storageType=field.storage_type ?? field.storageType ?? null;
    const storageColumn=field.storage_column ?? field.storageColumn ?? null;
    const storageKey=field.storage_key ?? field.storageKey ?? null;
    const referenceEntity=field.reference_entity ?? field.referenceEntity ?? null;
    if (storageType!==null && !STORAGE_KEYS.has(storageType)) throw AppError.validation("Unsupported field storage type.", [{ path:"storageType", message:`Unsupported storage type: ${storageType}.` }], { code:"FORM_FIELD_INVALID_STORAGE_TYPE" });
    if (storageType==="relational" && !storageColumn) throw AppError.validation("Relational fields require a storage column.", [{ path:"storageColumn", message:"storageColumn is required for relational fields." }], { code:"FORM_FIELD_INVALID_STORAGE_MAPPING" });
    if (storageType==="custom_data" && !storageKey) throw AppError.validation("Custom-data fields require a storage key.", [{ path:"storageKey", message:"storageKey is required for custom_data fields." }], { code:"FORM_FIELD_INVALID_STORAGE_MAPPING" });
    if (storageType==="reference" && !referenceEntity) throw AppError.validation("Reference fields require a reference entity.", [{ path:"referenceEntity", message:"referenceEntity is required for reference fields." }], { code:"FORM_FIELD_INVALID_STORAGE_MAPPING" });
    if (storageType==="specialized" && !storageKey) throw AppError.validation("Specialized fields require a storage key.", [{ path:"storageKey", message:"storageKey is required for specialized fields." }], { code:"FORM_FIELD_INVALID_STORAGE_MAPPING" });
    return { storageType, storageColumn, storageKey, referenceEntity };
}
function assertFieldDefinitionCompatibility(field) { assertTypeDataTypeCompatibility(field.type, field.dataType ?? field.data_type); normalizeStorageMapping(field); return true; }
export default Object.freeze({ TYPE_DATA_TYPES, assertKnownFieldType, assertKnownDataType, assertTypeDataTypeCompatibility, normalizeStorageMapping, assertFieldDefinitionCompatibility });
