import { useState } from "react";
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import { useAuth } from "../../context/useAuth";
import { roleService } from "../../services/roles/role.service";

export default function RoleManagementPage() {
  const { hasRole } = useAuth();
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formik = useFormik({
    initialValues: { code: "", name: "", description: "" },
    validate: (values) => {
      const errors = {};
      if (!/^[a-z][a-z0-9_]*$/.test(values.code.trim())) errors.code = "Use lowercase letters, numbers and underscores.";
      if (!values.name.trim()) errors.name = "Role name is required.";
      return errors;
    },
    onSubmit: async (values, helpers) => {
      setMessage("");
      setErrorMessage("");
      try {
        const response = await roleService.create(values);
        setMessage(response?.message || "Role created successfully.");
        helpers.resetForm();
      } catch (error) {
        setErrorMessage(error.response?.data?.message || error.response?.data?.error?.message || "Unable to create the role.");
      }
    },
  });

  if (!hasRole("admin")) return null;

  return (
    <Stack spacing={3} maxWidth="720px">
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={800}>Role Management</Typography>
        <Typography color="text.secondary">Create application-specific roles for users.</Typography>
      </Stack>
      {message && <Alert severity="success">{message}</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <Card><CardContent>
        <form onSubmit={formik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField fullWidth name="code" label="Role code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.code && Boolean(formik.errors.code)} helperText={formik.touched.code ? formik.errors.code : "Example: support_lead"} />
            <TextField fullWidth name="name" label="Role name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.name && Boolean(formik.errors.name)} helperText={formik.touched.name ? formik.errors.name : ""} />
            <TextField fullWidth multiline minRows={3} name="description" label="Description" value={formik.values.description} onChange={formik.handleChange} />
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}>{formik.isSubmitting ? "Creating..." : "Create role"}</Button>
          </Stack>
        </form>
      </CardContent></Card>
    </Stack>
  );
}
