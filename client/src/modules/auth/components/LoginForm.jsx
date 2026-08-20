import { useFormik } from "formik";
import { Alert, Button, Stack } from "@mui/material";
import { Link } from "react-router";
import FormTextField from "../../../components/forms/FormTextField";
import FormSubmitButton from "../../../components/forms/FormSubmitButton";

const FIELDS = Object.freeze([
  { name: "identifier", label: "Username or email", required: true, autoComplete: "username" },
  { name: "password", label: "Password", type: "password", required: true, autoComplete: "current-password" },
]);

export default function LoginForm({ onSubmit, loading }) {
  const formik = useFormik({
    initialValues: { identifier: "", password: "" },
    validate: (values) => {
      const errors = {};
      if (!values.identifier.trim()) errors.identifier = "Username or email is required.";
      if (!values.password) errors.password = "Password is required.";
      return errors;
    },
    onSubmit,
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Stack spacing={2.5}>
        {formik.status ? <Alert severity="error">{formik.status}</Alert> : null}
        {FIELDS.map((field) => (
          <FormTextField key={field.name} field={field} formik={formik} />
        ))}
        <Button component={Link} to="/ticket-status" variant="text" sx={{ alignSelf: "flex-start" }}>
          Check ticket status without signing in
        </Button>
        <FormSubmitButton fullWidth variant="contained" size="large" loading={loading}>
          Sign in
        </FormSubmitButton>
      </Stack>
    </form>
  );
}
