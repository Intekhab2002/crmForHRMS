import { useCallback } from "react";

import { Button, Grid, Stack, Typography } from "@mui/material";

import { Form } from "formik";

import { useContactLookup } from "../hooks/useContactLookup";
import FieldRenderer from "./FieldRenderer";
import { useNotification } from "../../../components/feedback/useNotification";

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
  const notification = useNotification();
  const handleContactFound = useCallback(
    (contact) => {
      formik.setFieldValue("name", contact.name ?? "", false);

      formik.setFieldValue("email_id", contact.email ?? "", false);

      formik.setFieldValue("district", contact.district ?? "", false);
      formik.setFieldValue("department", contact.department_id ?? "", false);

      notification.success("Contact found. Details have been populated.");
    },
    [formik.setFieldValue, notification.success],
  );

  const handleContactNotFound = useCallback(() => {
    notification.info(
      "No contact found. You can continue entering the contact details.",
    );
  }, [notification.info]);

  const handleLookupError = useCallback(() => {
    notification.error(
      "Unable to look up the contact. You can continue entering the contact details.",
    );
  }, [notification.error]);

  const { status: contactLookupStatus, isLoading: contactLookupLoading } =
    useContactLookup({
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
          <Grid key={field.key} size={field.form?.width ?? { xs: 6, md: 4 }}>
            <FieldRenderer
              field={field}
              formik={formik}
              options={options[field.key] ?? []}
              loading={
                Boolean(loadingOptions[field.key]) ||
                (field.key === "mobile_phone" && contactLookupLoading)
              }
            />

            {field.key === "mobile_phone" &&
            contactLookupStatus === "loading" ? (
              <Typography variant="caption" color="text.secondary">
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
          disabled={submitting || formik.isSubmitting}
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </Stack>
    </Form>
  );
}
