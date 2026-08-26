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

import { USER_FORM_FIELDS } from "../users.config";

export default function UserFormDialog({
  open,
  onClose,
  onSubmit,
  roleOptions,
  user,
  canEdit = true,
}) {
  const isEdit = Boolean(user);

  const fields = isEdit
    ? USER_FORM_FIELDS.filter(
        (field) =>
          field.name !== "password",
      )
    : USER_FORM_FIELDS;

  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      username:
        user?.username ?? "",

      email:
        user?.email ?? "",

      password: "",

      firstName:
        user?.first_name ?? "",

      lastName:
        user?.last_name ?? "",

      phone:
        user?.phone ?? "",

      designation:
        user?.designation ?? "",

      roleCode:
        user?.role?.code ??
        user?.roles?.[0]?.code ??
        roleOptions[0]?.value ??
        "",
    },

    validate: (values) => {
      const errors = {};

      if (!values.username.trim()) {
        errors.username =
          "Username is required.";
      }

      if (!values.email.trim()) {
        errors.email =
          "Email is required.";
      }

      if (
        !isEdit &&
        !values.password
      ) {
        errors.password =
          "Password is required.";
      }

      if (
        !isEdit &&
        values.password &&
        values.password.length < 8
      ) {
        errors.password =
          "Password must contain at least 8 characters.";
      }

      if (!values.roleCode) {
        errors.roleCode =
          "Role is required.";
      }

      return errors;
    },

    onSubmit: async (
      values,
      helpers,
    ) => {
      try {
        const payload = {
          ...values,
        };

        if (isEdit) {
          delete payload.password;

          const currentRoleCode =
            user?.role?.code ??
            user?.roles?.[0]?.code;

          if (
            payload.roleCode ===
            currentRoleCode
          ) {
            delete payload.roleCode;
          }
        }

        await onSubmit(payload);

        helpers.resetForm();
      } catch (error) {
        helpers.setStatus(
          error?.response?.data
            ?.message ??
            error?.response?.data
              ?.error?.message ??
            error?.message ??
            "Unable to save user.",
        );
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
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <form
        onSubmit={
          formik.handleSubmit
        }
        noValidate
      >
        <DialogTitle>
          {isEdit
            ? "Edit user"
            : "Create user"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack
            spacing={2.5}
            sx={{ pt: 1 }}
          >
            {formik.status ? (
              <Alert severity="error">
                {formik.status}
              </Alert>
            ) : null}

            {fields.map((field) =>
              field.name ===
              "roleCode" ? (
                <FormSelect
                  key={field.name}
                  field={field}
                  formik={formik}
                  options={roleOptions}
                  disabled={
                    !canEdit ||
                    formik.isSubmitting
                  }
                />
              ) : (
                <FormTextField
                  key={field.name}
                  field={field}
                  formik={formik}
                  disabled={
                    !canEdit ||
                    formik.isSubmitting
                  }
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
            loading={
              formik.isSubmitting
            }
            disabled={!canEdit}
          >
            {isEdit
              ? "Save changes"
              : "Create user"}
          </FormSubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}