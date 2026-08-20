
import { Navigate, Outlet } from "react-router";
import { CircularProgress, Stack } from "@mui/material";
import { useAuth } from "../context/useAuth";
import { AUTH_CONFIG } from "../config/auth.config";

export default function PublicRoute() {
  const { isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={AUTH_CONFIG.defaultAuthenticatedPath} replace />;
  }

  return <Outlet />;
}
