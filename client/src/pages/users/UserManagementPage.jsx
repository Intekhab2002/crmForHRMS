import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useAuth } from "../../context/useAuth";
import { userService } from "../../services/users/user.service";
import { roleService } from "../../services/roles/role.service";

const ROLE_LABELS = Object.freeze({
  superadmin: "Superadmin",
  admin: "Admin",
});

export default function UserManagementPage() {
  const { roles, hasPermission } = useAuth();
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    if (!roles.includes("admin")) return;
    void roleService.list({ page: 1, limit: 100, isActive: "true" })
      .then((response) => setAvailableRoles(response?.data || []))
      .catch(() => setAvailableRoles([]));
  }, [roles]);

  const roleOptions = useMemo(() => {
    const roleCodes = new Set(roles);
    if (roleCodes.has("developer")) return ["superadmin"];
    if (roleCodes.has("superadmin")) return ["admin"];
    if (roleCodes.has("admin")) {
      return availableRoles
        .map((role) => role.code)
        .filter((code) => !["developer", "superadmin", "admin"].includes(code));
    }
    return [];
  }, [roles, availableRoles]);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      roleCode: roleOptions[0] || "",
    },
    enableReinitialize: true,
    validate: (values) => {
      const errors = {};
      if (!values.username.trim()) errors.username = "Username is required.";
      if (!values.email.trim()) errors.email = "Email is required.";
      if (!values.password) errors.password = "Password is required.";
      if (!values.roleCode) errors.roleCode = "Role is required.";
      return errors;
    },
    onSubmit: async (values, helpers) => {
      setMessage("");
      setErrorMessage("");
      try {
        const response = await userService.create(values);
        setMessage(response?.message || "User created successfully.");
        helpers.resetForm({ values: { username: "", email: "", password: "", roleCode: roleOptions[0] || "" } });
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.error?.message ||
            "Unable to create the user.",
        );
      }
    },
  });

  if (!hasPermission("user:create")) {
    return null;
  }

  return (
    <Stack spacing={3} maxWidth="720px">
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={800}>User Management</Typography>
        <Typography color="text.secondary">Create users according to the configured role hierarchy.</Typography>
      </Stack>

      {message && <Alert severity="success">{message}</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField fullWidth name="username" label="Username" value={formik.values.username} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.username && Boolean(formik.errors.username)} helperText={formik.touched.username ? formik.errors.username : ""} autoComplete="off" />
              <TextField fullWidth name="email" type="email" label="Email" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email ? formik.errors.email : ""} autoComplete="off" />
              <TextField fullWidth name="password" type="password" label="Temporary password" value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.password && Boolean(formik.errors.password)} helperText={formik.touched.password ? formik.errors.password : ""} autoComplete="new-password" />
              <TextField select fullWidth name="roleCode" label="Role" value={formik.values.roleCode} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.roleCode && Boolean(formik.errors.roleCode)} helperText={formik.touched.roleCode ? formik.errors.roleCode : ""}>
                {roleOptions.map((roleCode) => (
                  <MenuItem key={roleCode} value={roleCode}>{ROLE_LABELS[roleCode] || roleCode}</MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained" disabled={formik.isSubmitting || roleOptions.length === 0}>
                {formik.isSubmitting ? "Creating..." : "Create user"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
}
