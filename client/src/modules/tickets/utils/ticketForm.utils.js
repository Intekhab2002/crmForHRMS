import * as Yup from "yup";

import { getOptionProvider } from "../../../components/forms/optionProviders/optionProvider.registry";

export async function getOptionSource(field, user) {
  if (Array.isArray(field.options)) {
    return field.options;
  }

  const source = field.options?.source;

  if (!source) {
    return [];
  }

  const provider = getOptionProvider(source);

  if (!provider) {
    return [];
  }

  return provider({
    user,
    field,
    config: field.options,
  });
}

export function buildInitialValues(fields, values, user, options = {}) {
  return fields.reduce((result, field) => {
    if (values && Object.prototype.hasOwnProperty.call(values, field.key)) {
      result[field.key] = values[field.key] ?? "";
      return result;
    }

    if (field.autoPopulate === "authenticatedUser") {
      result[field.key] = user?.id ?? "";
      return result;
    }

    if (field.key === "organization" && Array.isArray(options.organization)) {
      result[field.key] = options.organization[0]?.value ?? "";
      return result;
    }

    result[field.key] = field.defaultValue ?? "";
    return result;
  }, {});
}

export function buildValidationSchema(fields) {
  const shape = {};

  fields.forEach((field) => {
    let schema = Yup.mixed();

    if (field.type === "email") {
      schema = Yup.string().email("Enter a valid email address.");
    } else if (field.type === "text" || field.type === "textarea") {
      schema = Yup.string();
    }

    if (field.maxLength) {
      schema = schema.max(
        field.maxLength,
        `${field.label} must not exceed ${field.maxLength} characters.`,
      );
    }

    if (field.required) {
      schema = schema.required(`${field.label} is required.`);
    }

    shape[field.key] = schema;
  });

  return Yup.object(shape);
}