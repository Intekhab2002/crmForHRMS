import { useEffect, useMemo, useState, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../../context/useAuth";
import {
  TICKET_FORM_CONFIG,
  TICKET_FIELD_MAP,
} from "../../../config/ticket.config";
import { getOptionProvider } from "../../../components/forms/optionProviders/optionProvider.registry";
import TicketFormContent from "./TicketFormContent";

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

export function buildInitialValues(fields, values, user) {
  return fields.reduce((result, field) => {
    if (values && Object.prototype.hasOwnProperty.call(values, field.key)) {
      result[field.key] = values[field.key] ?? "";
      return result;
    }

    if (field.autoPopulate === "authenticatedUser") {
      result[field.key] = user?.id ?? "";
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

export default function TicketForm({
  mode = "create",
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel,
  onCancel,
}) {
  const { user } = useAuth();
  const fields = TICKET_FORM_CONFIG[mode].fields;

  const [options, setOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState({});
  const organizationId =
    user?.organization_id ??
    user?.organizationId ??
    user?.organization?.id ??
    "";

  console.log("[TicketForm] Contact lookup context", {
    user,
    organizationId,
  });
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const optionFields = fields.filter(
        (field) => field.type === "select" || field.type === "autocomplete",
      );

      console.log(
        "[TicketForm] Option fields:",
        optionFields.map((field) => ({
          key: field.key,
          source: field.options?.source,
          endpoint: field.options?.endpoint,
        })),
      );

      const results = await Promise.all(
        optionFields.map(async (field) => {
          setLoadingOptions((current) => ({
            ...current,
            [field.key]: true,
          }));

          try {
            return [field.key, await getOptionSource(field, user)];
          } catch (error) {
            console.error(
              `Failed to load options for field "${field.key}"`,
              error,
            );

            return [field.key, []];
          } finally {
            if (active) {
              setLoadingOptions((current) => ({
                ...current,
                [field.key]: false,
              }));
            }
          }
        }),
      );

      if (active) {
        setOptions(Object.fromEntries(results));
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [fields, user]);

  const formInitialValues = useMemo(
    () => buildInitialValues(fields, initialValues, user),
    [fields, initialValues, user],
  );

  const validationSchema = useMemo(
    () => buildValidationSchema(fields),
    [fields],
  );

  return (
    <Formik
      enableReinitialize
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formik) => {
        return (
          <TicketFormContent
            mode={mode}
            formik={formik}
            fields={fields}
            options={options}
            loadingOptions={loadingOptions}
            organizationId={organizationId}
            submitting={submitting}
            submitLabel={submitLabel ?? TICKET_FORM_CONFIG[mode].submitLabel}
            onCancel={onCancel}
          />
        );
      }}
    </Formik>
  );
}

export { TICKET_FIELD_MAP };
