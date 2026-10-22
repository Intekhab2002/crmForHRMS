
import { Navigate } from "react-router";

import { useAuth } from "../../../context/useAuth";
import { DASHBOARD_REGISTRY } from "../config/dashboardRegistry";

export default function DashboardIndexRedirect() {
  const { hasPermission } = useAuth();

  const firstAccessibleDashboard = DASHBOARD_REGISTRY.find(
    (dashboard) => hasPermission(dashboard.permission),
  );

  if (!firstAccessibleDashboard) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <Navigate
      to={firstAccessibleDashboard.path}
      replace
    />
  );
}
