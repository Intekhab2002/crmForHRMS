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
  submitting,
  submitLabel,
  onCancel,
  mode,
}) {
  const notification = useNotification();
  const handleContactFound = useCallback(
    (contact) => {
      formik.setFieldValue("name", contact.name ?? "", false);

      formik.setFieldValue("email_id", contact.email ?? "", false);

      formik.setFieldValue("district", contact.district?.id ?? null, false);

      formik.setFieldValue(
        "department",
        contact.department?.id ?? contact.departmentId ?? null,
        false,
      );

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

  const handleContactInactive = useCallback(
    (contact) => {
      formik.setFieldError(
        "mobile_phone",
        "This contact is inactive. You cannot create a ticket using this mobile number.",
      );

      notification.error(
        `Contact ${contact.name ?? ""} is inactive. You cannot create a ticket using this mobile number. Contact an authorized user to reactivate it.`,
      );
    },
    [formik.setFieldError, notification.error],
  );

  const { status: contactLookupStatus, isLoading: contactLookupLoading } =
    useContactLookup({
      organizationId: formik.values.organization,
      mobilePhone: formik.values.mobile_phone,
      enabled: mode === "create",
      onContactFound: handleContactFound,
      onContactNotFound: handleContactNotFound,
      onLookupError: handleLookupError,
      onContactInactive: handleContactInactive,
    });

  return (
    <Form noValidate>
      <Grid container spacing={0.5}>
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
        spacing={1}
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
