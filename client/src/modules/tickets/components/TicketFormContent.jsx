import { useCallback } from "react";

import { Button, Grid, Stack, Typography } from "@mui/material";

import { Form } from "formik";

import { useContactLookup } from "../hooks/useContactLookup";
import FieldRenderer from "./FieldRenderer";
import { useNotification } from "../../../components/feedback/useNotification";
import { useBillReferenceLookup } from "../hooks/useBillReferenceLookup";

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
  const {
    success: notifySuccess,
    info: notifyInfo,
    error: notifyError,
    warning: notifyWarning,
  } = useNotification();

  const { setFieldValue, setFieldError, values } = formik;

  const handleContactFound = useCallback(
    (contact) => {
      setFieldValue("name", contact.name ?? "", false);
      setFieldValue("email_id", contact.email ?? "", false);
      setFieldValue("district", contact.district?.id ?? null, false);

      setFieldValue(
        "department",
        contact.department?.id ?? contact.departmentId ?? null,
        false,
      );

      notifySuccess("Contact found. Details have been populated.");
    },
    [setFieldValue, notifySuccess],
  );

  const handleContactNotFound = useCallback(() => {
    notifyInfo(
      "No contact found. You can continue entering the contact details.",
    );
  }, [notifyInfo]);

  const handleLookupError = useCallback(() => {
    notifyError(
      "Unable to look up the contact. You can continue entering the contact details.",
    );
  }, [notifyError]);

  const handleContactInactive = useCallback(
    (contact) => {
      setFieldError(
        "mobile_phone",
        "This contact is inactive. You cannot create a ticket using this mobile number.",
      );

      notifyError(
        `Contact ${contact.name ?? ""} is inactive. You cannot create a ticket using this mobile number. Contact an authorized user to reactivate it.`,
      );
    },
    [setFieldError, notifyError],
  );

  const { status: contactLookupStatus, isLoading: contactLookupLoading } =
    useContactLookup({
      organizationId: values.organization,
      mobilePhone: values.mobile_phone,
      enabled: mode === "create",
      onContactFound: handleContactFound,
      onContactNotFound: handleContactNotFound,
      onLookupError: handleLookupError,
      onContactInactive: handleContactInactive,
    });

  const handleBillReferenceMatches = useCallback(
    (billReferenceNo, tickets) => {
      const ticketNumbers = tickets
        .map((ticket) => ticket.ticketNumber)
        .filter(Boolean);

      notifyWarning(
        `Bill reference number "${billReferenceNo}" is already associated with ${
          ticketNumbers.length
        } existing ticket(s): ${ticketNumbers.join(", ")}.`,
      );
    },
    [notifyWarning],
  );

  const handleBillReferenceLookupError = useCallback(() => {
    notifyError(
      "Unable to verify the bill reference number. You can continue entering the ticket details.",
    );
  }, [notifyError]);

  const handleBillReferenceNotFound = useCallback(
    (billReferenceNo) => {
      notifyInfo(
        `No existing ticket was found with bill reference number "${billReferenceNo}".`,
      );
    },
    [notifyInfo],
  );

  useBillReferenceLookup({
    billReferenceNo: values.bill_reference_no,
    enabled: mode === "create",
    onMatchesFound: handleBillReferenceMatches,
    onNoMatchesFound: handleBillReferenceNotFound,
    onLookupError: handleBillReferenceLookupError,
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
