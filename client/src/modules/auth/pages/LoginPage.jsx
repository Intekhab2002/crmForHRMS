import { Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../context/useAuth";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const { login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (values, helpers) => {
    try {
      await login(values);
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (error) {
      helpers.setStatus(
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        "Unable to sign in. Please verify your credentials.",
      );
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={800}>Sign in</Typography>
        <Typography color="text.secondary">Use your CRM credentials to continue.</Typography>
      </Stack>
      <LoginForm
        onSubmit={async (values, helpers) => {
          await handleSubmit(values, helpers);
        }}
        loading={isAuthenticating}
      />
    </Stack>
  );
}
