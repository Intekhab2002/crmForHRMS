import AppError from "../../helpers/AppError.js";

import formConfigurationService from "../formConfiguration/formConfiguration.service.js";

import fieldValidationEngine from "../formConfiguration/engines/fieldValidation.engine.js";
import fieldStorageEngine from "../formConfiguration/engines/fieldStorage.engine.js";

const FORM_CODE = "ticket.create";

function getRuntimeFields(runtimeForm) {
    return (
        runtimeForm?.runtimeMetadata?.fields ??
        runtimeForm?.runtime?.fields ??
        []
    );
}

function getRuntimeFormFields(runtimeForm) {
    const fields = getRuntimeFields(runtimeForm);

    if (!Array.isArray(fields)) {
        throw AppError.conflict(
            "Ticket runtime field configuration is invalid.",
            {
                code: "TICKET_RUNTIME_CONFIGURATION_INVALID",
            },
        );
    }

    return fields;
}

function buildWritablePayload(body, fields) {
    const fieldMap = new Map(
        fields.map((field) => [field.key, field]),
    );

    const dynamicPayload = {};

    for (const field of fields) {
        if (!field.visible) {
            continue;
        }

        if (
            field.key === "created_by" &&
            body[field.key] === undefined
        ) {
            continue;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                field.key,
            )
        ) {
            dynamicPayload[field.key] =
                body[field.key];
        }
    }

    for (const key of Object.keys(body)) {
        if (!fieldMap.has(key)) {
            continue;
        }

        dynamicPayload[key] = body[key];
    }

    return dynamicPayload;
}

async function resolveCreateMetadata() {
    const runtimeForm =
        await formConfigurationService.getRuntimeForm(
            FORM_CODE,
        );

    const fields =
        getRuntimeFormFields(runtimeForm);

    if (fields.length === 0) {
        throw AppError.conflict(
            "Ticket create form has no runtime fields.",
            {
                code: "TICKET_RUNTIME_CONFIGURATION_EMPTY",
            },
        );
    }

    return {
        runtimeForm,
        fields,
    };
}

async function prepareCreatePayload(body) {
    const { runtimeForm, fields } =
        await resolveCreateMetadata();

    const dynamicPayload =
        buildWritablePayload(
            body,
            fields,
        );

    const validated =
        fieldValidationEngine.validateDynamicPayload(
            fields,
            dynamicPayload,
            {
                operation: "create",
            },
        );

    const storage =
        fieldStorageEngine.splitDynamicPayload(
            fields,
            validated,
        );

    return {
        runtimeForm,
        fields,
        dynamicPayload: validated,
        storage,
    };
}

export default Object.freeze({
    prepareCreatePayload,
});