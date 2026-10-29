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
import FormSelect from "../../../components/forms/FormSelect";
import FormSubmitButton from "../../../components/forms/FormSubmitButton";
import { useNotification } from "../../../components/feedback/useNotification";

import { USER_FORM_FIELDS } from "../users.config";

const EDIT_PASSWORD_FIELDS = [
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    required: false,
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    autoComplete: "new-password",
    required: false,
  },
];

export default function UserFormDialog({
  open,
  onClose,
  onSubmit,
  roleOptions,
  user,
  canEdit = true,
}) {
  const isEdit = Boolean(user);
  const notification = useNotification();
  const fields = isEdit
    ? USER_FORM_FIELDS.filter((field) => field.name !== "password").flatMap(
        (field) =>
          field.name === "email" ? [field, ...EDIT_PASSWORD_FIELDS] : [field],
      )
    : USER_FORM_FIELDS;

  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      username: user?.username ?? "",

      email: user?.email ?? "",

      password: "",

      firstName: user?.first_name ?? "",

      lastName: user?.last_name ?? "",

      phone: user?.phone ?? "",

      designation: user?.designation ?? "",

      roleCode:
        user?.role?.code ??
        user?.roles?.[0]?.code ??
        roleOptions[0]?.value ??
        "",
      confirmPassword: "",
    },

    validate: (values) => {
      const errors = {};

      if (!values.username.trim()) {
        errors.username = "Username is required.";
      }

      if (!values.email.trim()) {
        errors.email = "Email is required.";
      }

      if (!isEdit && !values.password) {
        errors.password = "Password is required.";
      }

      if (!isEdit && values.password && values.password.length < 8) {
        errors.password = "Password must contain at least 8 characters.";
      }

      if (!values.roleCode) {
        errors.roleCode = "Role is required.";
      }

      if (isEdit) {
        const passwordEntered = values.password.length > 0;
        const confirmationEntered = values.confirmPassword.length > 0;

        if (passwordEntered || confirmationEntered) {
          if (!passwordEntered) {
            errors.password = "Password is required.";
          } else if (values.password.length < 8) {
            errors.password = "Password must contain at least 8 characters.";
          } else if (values.password.length > 128) {
            errors.password = "Password must not exceed 128 characters.";
          }

          if (!confirmationEntered) {
            errors.confirmPassword = "Please confirm the new password.";
          } else if (values.password !== values.confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
          }
        }
      }

      return errors;
    },

    onSubmit: async (values, helpers) => {
      try {
        const payload = { ...values };

        if (isEdit) {
          // An empty password means no password change was requested.
          if (!values.password && !values.confirmPassword) {
            delete payload.password;
            delete payload.confirmPassword;
          }

          const currentRoleCode = user?.role?.code ?? user?.roles?.[0]?.code;

          if (payload.roleCode === currentRoleCode) {
            delete payload.roleCode;
          }
        } else {
          // The create-user API does not accept confirmation fields.
          delete payload.confirmPassword;
        }

        await onSubmit(payload);
        helpers.resetForm();
      } catch (error) {
        notification.error(
          error?.response?.data?.message ??
            error?.response?.data?.error?.message ??
            error?.message ??
            "Unable to save user.",
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (!formik.isSubmitting) {
      formik.resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {fields.map((field) =>
              field.name === "roleCode" ? (
                <FormSelect
                  key={field.name}
                  field={field}
                  formik={formik}
                  options={roleOptions}
                  disabled={!canEdit || formik.isSubmitting}
                />
              ) : (
                <FormTextField
                  key={field.name}
                  field={field}
                  formik={formik}
                  disabled={!canEdit || formik.isSubmitting}
                />
              ),
            )}
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
            {isEdit ? "Save changes" : "Create user"}
          </FormSubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
