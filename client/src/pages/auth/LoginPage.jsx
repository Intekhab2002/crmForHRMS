import  { useState } from "react";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/useAuth";

export default function LoginPage() {
  const { login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState("");

  const formik = useFormik({
    initialValues: {
      identifier: "",
      password: "",
    },
    validate: (values) => {
      const errors = {};

      if (!values.identifier.trim()) {
        errors.identifier = "Username or email is required.";
      }

      if (!values.password) {
        errors.password = "Password is required.";
      }

      return errors;
    },
    onSubmit: async (values) => {
      setErrorMessage("");

      try {
        await login(values);
        const destination = location.state?.from?.pathname || "/dashboard";
        navigate(destination, { replace: true });
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Unable to sign in. Please verify your credentials.";
        setErrorMessage(message);
      }
    },
  });

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          Sign in
        </Typography>
        <Typography color="text.secondary">
          Use your CRM credentials to continue.
        </Typography>
      </Stack>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <form onSubmit={formik.handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            id="identifier"
            name="identifier"
            label="Username or email"
            value={formik.values.identifier}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.identifier && Boolean(formik.errors.identifier)}
            helperText={
              formik.touched.identifier ? formik.errors.identifier : ""
            }
            autoComplete="username"
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            type="password"
            label="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={
              formik.touched.password ? formik.errors.password : ""
            }
            autoComplete="current-password"
          />

          <Button
            component={Link}
            to="/ticket-status"
            variant="text"
            sx={{ alignSelf: "flex-start" }}
          >
            Check ticket status without signing in
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isAuthenticating}
          >
            {isAuthenticating ? "Signing in..." : "Sign in"}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
