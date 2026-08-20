
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/useAuth";

export default function PermissionRoute({
  permission,
  anyPermissions,
  allPermissions,
  children,
}) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuth();

  const allowed =
    (!permission || hasPermission(permission)) &&
    (!anyPermissions?.length || hasAnyPermission(anyPermissions)) &&
    (!allPermissions?.length || hasAllPermissions(allPermissions));

  return allowed ? (
    children ?? <Outlet />
  ) : (
    <Navigate to="/forbidden" replace />
  );
}
