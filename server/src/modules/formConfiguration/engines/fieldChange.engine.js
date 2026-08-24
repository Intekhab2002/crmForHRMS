/**
 * Metadata-aware field change collector.
 *
 * Uses stable field keys and returns safe before/after values. It does not
 * persist audit rows; the ticket lifecycle service remains responsible for
 * transaction/audit orchestration.
 */
function valuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function collectFieldChanges(fields, previousValues, nextValues) {
    const previous = previousValues ?? {};
    const next = nextValues ?? {};

    return fields
        .filter((field) => !valuesEqual(previous[field.key], next[field.key]))
        .map((field) => ({
            fieldKey: field.key,
            label: field.label,
            oldValue: previous[field.key] ?? null,
            newValue: next[field.key] ?? null,
        }));
}

export default Object.freeze({
    valuesEqual,
    collectFieldChanges,
});
