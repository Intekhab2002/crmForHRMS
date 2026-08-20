import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/useAuth";

export default function PermissionRoute({ roles = [], children }) {
  const { roles: currentRoles, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles.length && !currentRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }
  return children;
}
