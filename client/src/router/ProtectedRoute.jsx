import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import {
  CircularProgress,
  Stack,
} from "@mui/material";

import { useAuth } from "../context/useAuth";
import { AUTH_CONFIG } from "../config/auth.config";

export default function ProtectedRoute({
  children,
}) {
  const {
    isInitializing,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

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

  if (!isAuthenticated) {
    return (
      <Navigate
        to={AUTH_CONFIG.loginPath}
        replace
        state={{ from: location }}
      />
    );
  }

  return children ?? <Outlet />;
}