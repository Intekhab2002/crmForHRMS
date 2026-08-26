import { useEffect, useMemo, useState, useRef } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import apiClient from "../../../services/api/apiClient";
import { useAuth } from "../../../context/useAuth";
import {
  TICKET_FORM_CONFIG,
  TICKET_FIELD_MAP,
} from "../../../config/ticket.config";
import { getOptionProvider } from "../../../components/forms/optionProviders/optionProvider.registry";
import { findContactByMobile } from "../../contacts/services/contact.service";
import TicketFormContent from "./TicketFormContent";

async function getOptionSource(field, user) {
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

function buildInitialValues(fields, values, user) {
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

function buildValidationSchema(fields) {
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

function FieldRenderer({ field, formik, options, loading }) {
  const value = formik.values[field.key] ?? "";
  const error =
    formik.touched[field.key] && formik.errors[field.key]
      ? formik.errors[field.key]
      : "";

  const common = {
    fullWidth: true,
    name: field.key,
    label: field.label,
    value,
    error: Boolean(error),
    helperText: error || " ",
    onBlur: formik.handleBlur,
    disabled: field.readOnly,
  };

  if (field.type === "select") {
    return (
      <TextField {...common} select onChange={formik.handleChange}>
        <MenuItem value="">
          <em>Select {field.label}</em>
        </MenuItem>

        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "autocomplete") {
    const selected = options.find((option) => option.value === value) ?? null;

    return (
      <Autocomplete
        options={options}
        loading={loading}
        value={selected}
        getOptionLabel={(option) => option?.label ?? ""}
        isOptionEqualToValue={(option, current) =>
          option.value === current.value
        }
        onChange={(_, option) =>
          formik.setFieldValue(field.key, option?.value ?? "")
        }
        onBlur={() => formik.setFieldTouched(field.key, true)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={field.label}
            placeholder={field.placeholder}
            error={Boolean(error)}
            helperText={error || " "}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <TextField
        {...common}
        multiline
        minRows={field.minRows ?? 4}
        placeholder={field.placeholder}
        onChange={formik.handleChange}
      />
    );
  }

  return (
    <TextField
      {...common}
      type={field.type === "date" ? "date" : field.type}
      InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
      placeholder={field.placeholder}
      inputProps={{
        maxLength: field.maxLength,
      }}
      onChange={formik.handleChange}
    />
  );
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
          // <Form noValidate>
          //   <Grid container spacing={1}>
          //     {fields.map((field) => (
          //       <Grid
          //         key={field.key}
          //         size={field.form?.width ?? { xs: 6, md: 4 }}
          //       >
          //         <FieldRenderer
          //           field={field}
          //           formik={formik}
          //           options={options[field.key] ?? []}
          //           loading={Boolean(loadingOptions[field.key])}
          //         />
          //       </Grid>
          //     ))}
          //   </Grid>

          //   <Stack
          //     direction="row"
          //     justifyContent="flex-end"
          //     spacing={2}
          //     sx={{ mt: 2 }}
          //   >
          //     {onCancel ? (
          //       <Button
          //         type="button"
          //         variant="outlined"
          //         disabled={submitting}
          //         onClick={onCancel}
          //       >
          //         Cancel
          //       </Button>
          //     ) : null}

          //     <Button
          //       type="submit"
          //       variant="contained"
          //       disabled={submitting || formik.isSubmitting}
          //     >
          //       {submitting
          //         ? "Saving..."
          //         : (submitLabel ?? TICKET_FORM_CONFIG[mode].submitLabel)}
          //     </Button>
          //   </Stack>
          // </Form>
          <TicketFormContent
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
