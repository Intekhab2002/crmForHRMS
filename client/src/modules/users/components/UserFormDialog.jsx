import { useFormik } from "formik";
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import FormTextField from "../../../components/forms/FormTextField";
import FormSelect from "../../../components/forms/FormSelect";
import FormSubmitButton from "../../../components/forms/FormSubmitButton";
import { USER_FORM_FIELDS } from "../users.config";

export default function UserFormDialog({ open, onClose, onSubmit, roleOptions, user }) {
  const isEdit = Boolean(user);
  const fields = isEdit ? USER_FORM_FIELDS.filter((field) => field.name !== "password") : USER_FORM_FIELDS;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      password: "",
      roleCode: user?.role?.code ?? roleOptions[0]?.value ?? "",
    },
    validate: (values) => {
      const errors = {};
      if (!values.username.trim()) errors.username = "Username is required.";
      if (!values.email.trim()) errors.email = "Email is required.";
      if (!isEdit && !values.password) errors.password = "Password is required.";
      if (!values.roleCode) errors.roleCode = "Role is required.";
      return errors;
    },
    onSubmit: async (values, helpers) => {
      try {
        const payload = { ...values };
        if (isEdit) {
          delete payload.password;
          if (payload.roleCode === user?.role?.code) {
            delete payload.roleCode;
          }
        }
        await onSubmit(payload);
        helpers.resetForm();
        onClose();
      } catch (error) {
        helpers.setStatus(
          error.response?.data?.message || error.response?.data?.error?.message || "Unable to save user.",
        );
      }
    },
  });

  return (
    <Dialog open={open} onClose={formik.isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formik.status ? <Alert severity="error">{formik.status}</Alert> : null}
            {fields.map((field) => (
              field.name === "roleCode"
                ? <FormSelect key={field.name} field={field} formik={formik} options={roleOptions} />
                : <FormTextField key={field.name} field={field} formik={formik} />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <FormSubmitButton variant="contained" loading={formik.isSubmitting}>
            {isEdit ? "Save changes" : "Create user"}
          </FormSubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
