
import { useAuth } from "../../context/useAuth";

export default function CanAccess({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  const allowed =
    (!permission || hasPermission(permission)) &&
    (!anyPermissions?.length || hasAnyPermission(anyPermissions)) &&
    (!allPermissions?.length || hasAllPermissions(allPermissions));

  if (!allowed) return fallback;

  return typeof children === "function" ? children({ allowed }) : children;
}
