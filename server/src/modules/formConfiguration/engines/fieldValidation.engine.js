/**
 * Backend authoritative dynamic-field value validation.
 *
 * Values are validated without coercion. The returned object preserves the
 * submitted value types.
 */
import AppError from "../../../helpers/AppError.js";

function addError(errors, field, message) {
    errors.push({
        path: field.key,
        fieldKey: field.key,
        message,
    });
}

function isEmpty(value) {
    return value === null || value === undefined || value === "";
}

function validateDataType(field, value, errors) {
    if (isEmpty(value)) return;

    const type = field.dataType;

    if (type === "string" && typeof value !== "string") {
        addError(errors, field, "Expected a string.");
    } else if (type === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
        addError(errors, field, "Expected a finite number.");
    } else if (type === "boolean" && typeof value !== "boolean") {
        addError(errors, field, "Expected a boolean.");
    } else if (type === "array" && !Array.isArray(value)) {
        addError(errors, field, "Expected an array.");
    } else if (type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
        addError(errors, field, "Expected an ISO date in YYYY-MM-DD format.");
    } else if (type === "datetime" && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) {
        addError(errors, field, "Expected a valid ISO datetime string.");
    } else if (type === "time" && (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value))) {
        addError(errors, field, "Expected a valid time string.");
    } else if (type === "file" && (typeof value !== "object" || value === null || Array.isArray(value))) {
        addError(errors, field, "Expected a file descriptor.");
    }
}

function validateRules(field, value, errors) {
    if (isEmpty(value)) return;

    const config = field.validation ?? {};

    if (typeof value === "string") {
        if (config.minLength !== undefined && value.length < config.minLength) {
            addError(errors, field, `Minimum length is ${config.minLength}.`);
        }

        if (config.maxLength !== undefined && value.length > config.maxLength) {
            addError(errors, field, `Maximum length is ${config.maxLength}.`);
        }

        if (config.regexPattern) {
            let regex;
            try {
                regex = new RegExp(config.regexPattern);
            } catch {
                addError(errors, field, "Field validation configuration contains an invalid regular expression.");
                return;
            }

            if (!regex.test(value)) {
                addError(errors, field, "Value does not match the configured pattern.");
            }
        }

        if (config.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            addError(errors, field, "Expected a valid email address.");
        }

        if (config.url) {
            try {
                new URL(value);
            } catch {
                addError(errors, field, "Expected a valid URL.");
            }
        }
    }

    if (typeof value === "number") {
        if (config.minValue !== undefined && value < config.minValue) {
            addError(errors, field, `Minimum value is ${config.minValue}.`);
        }

        if (config.maxValue !== undefined && value > config.maxValue) {
            addError(errors, field, `Maximum value is ${config.maxValue}.`);
        }

        if (config.integer && !Number.isInteger(value)) {
            addError(errors, field, "Expected an integer.");
        }

        if (config.decimal && Number.isInteger(value)) {
            addError(errors, field, "Expected a decimal value.");
        }
    }
}

function validateOptions(field, value, errors) {
    if (isEmpty(value)) return;

    const staticOptions = field.options?.static;

    if (!Array.isArray(staticOptions) || staticOptions.length === 0) return;

    const allowed = new Set(staticOptions.map((option) => option.value));
    const values = field.type === "multi_select" ? value : [value];

    for (const item of values) {
        if (!allowed.has(item)) {
            addError(errors, field, "Value is not one of the configured options.");
        }
    }
}

function validateRequired(field, value, errors) {
    const required = field.required || field.validation?.required;

    if (required && isEmpty(value)) {
        addError(errors, field, "This field is required.");
    }

    if (required && Array.isArray(value) && value.length === 0) {
        addError(errors, field, "This field is required.");
    }
}

function validateDynamicPayload(fields, payload, { operation = "create" } = {}) {
    const values = payload ?? {};

    if (!values || typeof values !== "object" || Array.isArray(values)) {
        throw AppError.validation(
            "Dynamic field payload must be an object.",
            [],
            { code: "FORM_DYNAMIC_PAYLOAD_INVALID" },
        );
    }

    const fieldMap = new Map(fields.map((field) => [field.key, field]));
    const errors = [];

    for (const key of Object.keys(values)) {
        const field = fieldMap.get(key);

        if (!field) {
            errors.push({
                path: key,
                fieldKey: key,
                message: `Field '${key}' is not defined for this form.`,
            });
            continue;
        }

        if (!field.enabled || field.readOnly || !field.editable) {
            errors.push({
                path: key,
                fieldKey: key,
                message: `Field '${key}' is not writable.`,
            });
            continue;
        }

        validateDataType(field, values[key], errors);
        validateRules(field, values[key], errors);
        validateOptions(field, values[key], errors);
    }

    if (operation === "create") {
        for (const field of fields) {
            if (field.required || field.validation?.required) {
                validateRequired(field, values[field.key], errors);
            }
        }
    }

    if (errors.length > 0) {
        throw AppError.validation(
            "Dynamic field validation failed.",
            errors,
            { code: "FORM_DYNAMIC_FIELD_VALIDATION_FAILED" },
        );
    }

    return { ...values };
}

export default Object.freeze({
    validateDynamicPayload,
});
