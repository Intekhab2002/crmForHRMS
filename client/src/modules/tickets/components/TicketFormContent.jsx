import {
  useCallback,
} from "react";

import {
  Box,
  Grid,
  Stack,
  Button,
  Typography,
} from "@mui/material";

import { Form } from "formik";

import FieldRenderer from "";
import { useContactLookup } from "../hooks/useContactLookup";

export default function TicketFormContent({
  formik,
  fields,
  options,
  loadingOptions,
  organizationId,
  submitting,
  submitLabel,
  onCancel,
}) {
  const handleContactFound = useCallback(
    (contact) => {
      formik.setFieldValue(
        "name",
        contact.name ?? "",
        false,
      );

      formik.setFieldValue(
        "email_id",
        contact.email ?? "",
        false,
      );

      formik.setFieldValue(
        "district",
        contact.district ?? "",
        false,
      );

      formik.setFieldValue(
        "department",
        contact.department_id ?? "",
        false,
      );
    },
    [formik],
  );

  const {
    status: contactLookupStatus,
    isLoading: contactLookupLoading,
  } = useContactLookup({
    organizationId,
    mobilePhone: formik.values.mobile_phone,
    onContactFound: handleContactFound,
  });

  return (
    <Form noValidate>
      <Grid container spacing={1}>
        {fields.map((field) => (
          <Grid
            key={field.key}
            size={field.form?.width ?? { xs: 6, md: 4 }}
          >
            <FieldRenderer
              field={field}
              formik={formik}
              options={options[field.key] ?? []}
              loading={
                Boolean(loadingOptions[field.key]) ||
                (
                  field.key === "mobile_phone" &&
                  contactLookupLoading
                )
              }
            />

            {field.key === "mobile_phone" &&
              contactLookupStatus === "loading" ? (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Searching contact...
              </Typography>
            ) : null}
          </Grid>
        ))}
      </Grid>

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={2}
        sx={{ mt: 2 }}
      >
        {onCancel ? (
          <Button
            type="button"
            variant="outlined"
            disabled={submitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          disabled={
            submitting ||
            formik.isSubmitting
          }
        >
          {submitting
            ? "Saving..."
            : submitLabel}
        </Button>
      </Stack>
    </Form>
  );
}