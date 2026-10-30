import { useFormik } from "formik";

import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";

import FormTextField from "../../../components/forms/FormTextField";
import FormSubmitButton from "../../../components/forms/FormSubmitButton";

import { ROLE_FORM_FIELDS } from "../roles.config";
import { useNotification } from "../../../components/feedback";

export default function RoleFormDialog({
  open,
  onClose,
  onSubmit,
  role = null,
  canEdit = true,
}) {
  const notification = useNotification();
  const isEdit = Boolean(role);

  const fields = isEdit
    ? ROLE_FORM_FIELDS.filter((field) => field.name !== "code")
    : ROLE_FORM_FIELDS;

  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      code: role?.code ?? "",

      name: role?.name ?? "",

      description: role?.description ?? "",
    },

    validate: (values) => {
      const errors = {};

      if (!isEdit && !values.code.trim()) {
        errors.code = "Role code is required.";
      }

      if (!values.name.trim()) {
        errors.name = "Role name is required.";
      }

      return errors;
    },

    onSubmit: async (values, helpers) => {
      try {
        const payload = {
          ...values,
        };

        if (isEdit) {
          delete payload.code;
        }

        await onSubmit(payload);

        helpers.resetForm();
      } catch (error) {
        notification.error(
          error?.response?.data?.message ??
            error?.response?.data?.error?.message ??
            error?.message ??
            "Unable to save role.",
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <Dialog
      open={open}
      onClose={formik.isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle>{isEdit ? "Edit role" : "Create role"}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {fields.map((field) => (
              <FormTextField
                key={field.name}
                field={field}
                formik={formik}
                disabled={!canEdit || formik.isSubmitting}
              />
            ))}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <FormSubmitButton
            variant="contained"
            loading={formik.isSubmitting}
            disabled={!canEdit}
          >
            {isEdit ? "Save changes" : "Create role"}
          </FormSubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
