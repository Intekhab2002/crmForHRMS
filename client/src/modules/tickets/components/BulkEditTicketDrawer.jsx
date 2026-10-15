import { useEffect, useMemo, useState } from "react";
import { Formik } from "formik";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuth } from "../../../context/useAuth";
import { TICKET_FIELD_CONFIG } from "../../../config/ticket.config";
import FieldRenderer from "./FieldRenderer";
import { getOptionSource } from "./TicketForm";

const BULK_EDIT_FIELDS = TICKET_FIELD_CONFIG.filter(
  (field) =>
    field.entity === "ticket" &&
    field.form?.update === true &&
    field.readOnly !== true &&
    field.type !== "file" &&
    field.specialized !== true,
);

const INITIAL_VALUES = Object.freeze(
  Object.fromEntries(BULK_EDIT_FIELDS.map((field) => [field.key, ""])),
);

export default function BulkEditTicketDrawer({
  open,
  selectedCount = 0,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const { user } = useAuth();
  const [enabledFields, setEnabledFields] = useState([]);
  const [options, setOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState({});
  const [optionsError, setOptionsError] = useState("");

  const optionFields = useMemo(
    () =>
      BULK_EDIT_FIELDS.filter(
        (field) =>
          field.type === "select" || field.type === "autocomplete",
      ),
    [],
  );

  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    async function loadOptions() {
      setOptionsError("");
      setLoadingOptions(
        Object.fromEntries(optionFields.map((field) => [field.key, true])),
      );

      const results = await Promise.all(
        optionFields.map(async (field) => {
          try {
            return [field.key, await getOptionSource(field, user)];
          } catch (error) {
            console.error(
              `Failed to load bulk-edit options for "${field.key}".`,
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

      if (!active) return;

      setOptions(Object.fromEntries(results));

      if (results.some(([, fieldOptions]) => fieldOptions.length === 0)) {
        setOptionsError(
          "Some field options could not be loaded. Verify the options before submitting.",
        );
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [open, optionFields, user]);

  const handleClose = () => {
    if (submitting) return;
    setEnabledFields([]);
    setOptionsError("");
    onClose?.();
  };

  const handleSubmit = async (values, formikHelpers) => {
    const changes = {};

    for (const field of BULK_EDIT_FIELDS) {
      if (!enabledFields.includes(field.key)) continue;

      const value = values[field.key];

      if (field.required && (value === "" || value === null || value === undefined)) {
        formikHelpers.setFieldTouched(field.key, true, false);
        formikHelpers.setFieldError(field.key, `${field.label} is required.`);
        return;
      }

      changes[field.key] =
        value === "" || value === undefined ? null : value;
    }

    if (Object.keys(changes).length === 0) {
      setOptionsError("Select at least one field to update.");
      return;
    }

    setOptionsError("");

    try {
      await onSubmit?.(changes);
      setEnabledFields([]);
      formikHelpers.resetForm();
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 560, md: 640 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ p: 2.5, pb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Bulk Edit Tickets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Apply selected field values to {selectedCount} selected ticket
            {selectedCount === 1 ? "" : "s"}. Fields you leave unchecked will
            remain unchanged.
          </Typography>
        </Box>
        <IconButton
          aria-label="Close bulk edit"
          onClick={handleClose}
          disabled={submitting}
          size="small"
        >
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        {optionsError ? (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setOptionsError("")}>
            {optionsError}
          </Alert>
        ) : null}

        <Alert severity="info" sx={{ mb: 2 }}>
          Only checked fields are sent to the server. Each ticket is validated
          and updated independently; failures do not roll back successful tickets.
        </Alert>

        <Formik
          initialValues={INITIAL_VALUES}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <form id="bulk-edit-ticket-form" onSubmit={formik.handleSubmit} noValidate>
              <Stack spacing={2}>
                {BULK_EDIT_FIELDS.map((field) => {
                  const enabled = enabledFields.includes(field.key);

                  return (
                    <Box
                      key={field.key}
                      sx={{
                        p: 1.5,
                        border: 1,
                        borderColor: enabled ? "primary.main" : "divider",
                        borderRadius: 2,
                        bgcolor: enabled ? "action.hover" : "background.paper",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={enabled}
                            disabled={submitting}
                            onChange={(event) => {
                              setEnabledFields((current) =>
                                event.target.checked
                                  ? [...current, field.key]
                                  : current.filter((key) => key !== field.key),
                              );
                              formik.setFieldTouched(field.key, false, false);
                              formik.setFieldError(field.key, undefined);
                            }}
                            inputProps={{
                              "aria-label": `Apply ${field.label} to selected tickets`,
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={700}>
                            Apply {field.label}
                          </Typography>
                        }
                      />

                      {enabled ? (
                        <Box sx={{ mt: 1 }}>
                          <FieldRenderer
                            field={field}
                            formik={formik}
                            options={options[field.key] ?? []}
                            loading={Boolean(loadingOptions[field.key])}
                          />
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
            </form>
          )}
        </Formik>
      </Box>

      <Divider />

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1}
        sx={{ p: 2.5 }}
      >
        <Button variant="outlined" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="bulk-edit-ticket-form"
          variant="contained"
          disabled={submitting || selectedCount === 0}
        >
          {submitting ? "Updating…" : `Update ${selectedCount} Tickets`}
        </Button>
      </Stack>
    </Drawer>
  );
}
