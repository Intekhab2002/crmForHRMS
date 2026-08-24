/**
 * Runtime form engine.
 *
 * Produces the stable, renderer-safe contract consumed by clients and by
 * backend ticket validation. Storage internals are intentionally excluded.
 */
import AppError from "../../../helpers/AppError.js";

import metadataEngine from "./fieldMetadata.engine.js";

function buildRuntimeForm(form, assignments, { includeStorage = false } = {}) {
    if (!form) {
        throw AppError.notFound(
            "Form definition not found.",
            { code: "FORM_DEFINITION_NOT_FOUND" },
        );
    }

    const fields = metadataEngine.resolveRuntimeFields(assignments, { includeStorage });

    return {
        id: form.id,
        code: form.code,
        name: form.name,
        module: form.module,
        description: form.description ?? null,
        status: form.status,
        fields,
    };
}

export default Object.freeze({
    buildRuntimeForm,
});
