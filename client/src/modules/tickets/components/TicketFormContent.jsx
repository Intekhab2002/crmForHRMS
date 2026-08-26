import { useCallback } from "react";

import {
  Alert,
  Button,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { Form } from "formik";

import { useContactLookup } from "../hooks/useContactLookup";
import FieldRenderer from "./FieldRenderer";

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

  const handleContactNotFound = useCallback(() => {
    // This is intentionally only UI state.
    // Contact will be created/updated on submit.
  }, []);

  const handleLookupError = useCallback(
    (error) => {
      console.error(
        "[TicketForm] Contact lookup failed.",
        error,
      );
    },
    [],
  );

  const {
    status: contactLookupStatus,
    isLoading: contactLookupLoading,
  } = useContactLookup({
    organizationId,
    mobilePhone: formik.values.mobile_phone,
    onContactFound: handleContactFound,
    onContactNotFound: handleContactNotFound,
    onLookupError: handleLookupError,
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

            {field.key === "mobile_phone" &&
              contactLookupStatus === "found" ? (
              <Alert
                severity="success"
                sx={{ mt: 0.5 }}
              >
                Contact found. Details have been populated.
              </Alert>
            ) : null}

            {field.key === "mobile_phone" &&
              contactLookupStatus === "not_found" ? (
              <Alert
                severity="info"
                sx={{ mt: 0.5 }}
              >
                No contact found. A new contact will be created when you submit the ticket.
              </Alert>
            ) : null}

            {field.key === "mobile_phone" &&
              contactLookupStatus === "error" ? (
              <Alert
                severity="warning"
                sx={{ mt: 0.5 }}
              >
                Contact lookup failed. You can continue entering the contact details.
              </Alert>
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