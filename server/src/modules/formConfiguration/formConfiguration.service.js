import AppError from "../../helpers/AppError.js";

import repository from "./formConfiguration.repository.js";

import {
    FIELD_ERROR_CODES,
} from "./formConfiguration.constants.js";

function assertFieldId(fieldId) {
    if (
        typeof fieldId !== "string" ||
        fieldId.trim().length === 0
    ) {
        throw AppError.badRequest(
            "Field ID is required.",
            {
                code: "FORM_FIELD_INVALID_ID",
            },
        );
    }
}

function normalizeConflict(error) {
    if (error?.code === "23505") {
        throw AppError.conflict(
            "A field with this key already exists.",
            {
                code: FIELD_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    throw error;
}

async function listFields(query) {
    const page = query.page;

    const limit = query.limit;

    const offset =
        (page - 1) * limit;

    const result =
        await repository.findFields({
            search: query.search,
            type: query.type,
            status: query.status,
            includeDeleted:
                query.includeDeleted,
            limit,
            offset,
        });

    const total = Number(result.total);

    const totalPages =
        total === 0
            ? 0
            : Math.ceil(total / limit);

    return {
        data: result.rows,

        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage:
                page < totalPages,
            hasPreviousPage:
                page > 1 &&
                totalPages > 0,
        },
    };
}

async function getFieldById(fieldId) {
    assertFieldId(fieldId);

    const field =
        await repository.findFieldById(
            fieldId,
        );

    if (!field) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    FIELD_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return field;
}

async function createField(
    data,
    actorId,
) {
    const existing =
        await repository.findFieldByKey(
            data.fieldKey,
        );

    if (existing) {
        throw AppError.conflict(
            "A field with this key already exists.",
            {
                code:
                    FIELD_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    try {
        return await repository.createField(
            data,
            actorId,
        );
    } catch (error) {
        return normalizeConflict(error);
    }
}

async function updateField(
    fieldId,
    data,
    actorId,
) {
    assertFieldId(fieldId);

    const existing =
        await repository.findFieldById(
            fieldId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    FIELD_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    try {
        return await repository.updateField(
            fieldId,
            data,
            actorId,
        );
    } catch (error) {
        return normalizeConflict(error);
    }
}

async function disableField(
    fieldId,
    actorId,
) {
    assertFieldId(fieldId);

    const existing =
        await repository.findFieldById(
            fieldId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    FIELD_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return repository.deactivateField(
        fieldId,
        actorId,
    );
}

async function enableField(
    fieldId,
    actorId,
) {
    assertFieldId(fieldId);

    const existing =
        await repository.findFieldById(
            fieldId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    FIELD_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return repository.activateField(
        fieldId,
        actorId,
    );
}

async function deleteField(
    fieldId,
    actorId,
) {
    assertFieldId(fieldId);

    const existing =
        await repository.findFieldById(
            fieldId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    FIELD_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    if (existing.is_deleted) {
        throw AppError.conflict(
            "The form field is already deleted.",
            {
                code:
                    "FORM_FIELD_ALREADY_DELETED",
            },
        );
    }

    return repository.softDeleteField(
        fieldId,
        actorId,
    );
}

async function restoreField(
    fieldId,
    actorId,
) {
    assertFieldId(fieldId);

    const existing =
        await repository.findFieldById(
            fieldId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    FIELD_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    if (!existing.is_deleted) {
        throw AppError.conflict(
            "The form field is not deleted.",
            {
                code:
                    "FORM_FIELD_NOT_DELETED",
            },
        );
    }

    return repository.restoreField(
        fieldId,
        actorId,
    );
}

async function listForms(query) {
    const page = query.page;

    const limit = query.limit;

    const offset =
        (page - 1) * limit;

    const result =
        await repository.findForms({
            search: query.search,
            status: query.status,
            includeDeleted:
                query.includeDeleted,
            limit,
            offset,
        });

    const total = Number(result.total);

    const totalPages =
        total === 0
            ? 0
            : Math.ceil(total / limit);

    return {
        data: result.rows,

        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage:
                page < totalPages,
            hasPreviousPage:
                page > 1 &&
                totalPages > 0,
        },
    };
}


function isUuid(value) {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
        )
    );
}


async function getFormByIdentifier(
    identifier,
) {
    if (isUuid(identifier)) {
        const result =
            await getFormById(
                identifier,
            );

        return {
            mode: "administrative",
            ...result,
        };
    }

    const result =
        await getRuntimeForm(
            identifier,
        );

    return {
        mode: "runtime",
        ...result,
    };
}


async function getFormById(formId) {
    const form =
        await repository.findFormById(
            formId,
        );

    if (!form) {
        throw AppError.notFound(
            "Form definition not found.",
            {
                code:
                    FORM_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    const assignments =
        await repository.findFormAssignments(
            formId,
        );

    return {
        form,
        assignments,
    };
}


async function createForm(
    data,
    actorId,
) {
    const existing =
        await repository.findFormByCode(
            data.code,
        );

    if (existing) {
        throw AppError.conflict(
            "A form with this code already exists.",
            {
                code:
                    FORM_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    try {
        return await repository.createForm(
            data,
            actorId,
        );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A form with this code already exists.",
                {
                    code:
                        FORM_ERROR_CODES.CODE_EXISTS,
                },
            );
        }

        throw error;
    }
}


async function updateForm(
    formId,
    data,
    actorId,
) {
    const existing =
        await repository.findFormById(
            formId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form definition not found.",
            {
                code:
                    FORM_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return repository.updateForm(
        formId,
        data,
        actorId,
    );
}


async function deleteForm(
    formId,
    actorId,
) {
    const existing =
        await repository.findFormById(
            formId,
        );

    if (!existing) {
        throw AppError.notFound(
            "Form definition not found.",
            {
                code:
                    FORM_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return repository.deleteForm(
        formId,
        actorId,
    );
}


async function assignField(
    formId,
    fieldId,
    data,
    actorId,
) {
    const form =
        await repository.findFormById(
            formId,
        );

    if (!form || form.is_deleted) {
        throw AppError.notFound(
            "Form definition not found.",
            {
                code:
                    ASSIGNMENT_ERROR_CODES.FORM_NOT_FOUND,
            },
        );
    }

    const field =
        await repository.findFieldById(
            fieldId,
        );

    if (!field || field.is_deleted) {
        throw AppError.notFound(
            "Form field not found.",
            {
                code:
                    ASSIGNMENT_ERROR_CODES.FIELD_NOT_FOUND,
            },
        );
    }

    const existing =
        await repository.findAssignment(
            formId,
            fieldId,
        );

    if (existing) {
        throw AppError.conflict(
            "This field is already assigned to the form.",
            {
                code:
                    ASSIGNMENT_ERROR_CODES.ALREADY_ASSIGNED,
            },
        );
    }

    try {
         await repository.createAssignment(
            {
                formId,
                fieldId,
                ...data,
            },
            actorId,
        );

    return repository.findAssignment(
    formId,
    fieldId,
);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "This field is already assigned to the form.",
                {
                    code:
                        ASSIGNMENT_ERROR_CODES.ALREADY_ASSIGNED,
                },
            );
        }

        throw error;
    }
}


async function removeField(
    formId,
    fieldId,
) {
    const assignment =
        await repository.findAssignment(
            formId,
            fieldId,
        );

    if (!assignment) {
        throw AppError.notFound(
            "Field assignment not found.",
            {
                code:
                    ASSIGNMENT_ERROR_CODES.NOT_ASSIGNED,
            },
        );
    }

    await repository.deleteAssignment(
        formId,
        fieldId,
    );
}


async function getRuntimeForm(
    formCode,
) {
    const form =
        await repository.findFormByCode(
            formCode,
        );

    if (
        !form ||
        form.is_deleted ||
        form.status !== "active"
    ) {
        throw AppError.notFound(
            "Form definition not found.",
            {
                code:
                    FORM_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    const assignments =
        await repository.findFormAssignments(
            form.id,
        );

    return {
        form,
        assignments,
    };
}
export default Object.freeze({
    listFields,
    getFieldById,
    createField,
    updateField,
    disableField,
    enableField,
    deleteField,
    restoreField,
      // Forms
    listForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,

    // Assignments
    assignField,
    removeField,

    // Runtime
    getRuntimeForm,
    getFormByIdentifier,
});