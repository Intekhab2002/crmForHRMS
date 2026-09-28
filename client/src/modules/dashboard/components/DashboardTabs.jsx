import { Tab, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { DASHBOARD_REGISTRY } from "../config/dashboardRegistry";
import { useAuth } from "../../../context/useAuth";

export default function DashboardTabs() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visible = DASHBOARD_REGISTRY.filter((item) => hasPermission(item.permission));
  const current = visible.find((item) => location.pathname.startsWith(item.path))?.code || visible[0]?.code || false;

  return (
    <Tabs
      value={current}
      onChange={(_, value) => {
        const target = visible.find((item) => item.code === value);
        if (target) navigate(target.path);
      }}
      variant="scrollable"
      allowScrollButtonsMobile
    >
      {visible.map((item) => (
        <Tab key={item.code} value={item.code} label={item.name} />
      ))}
    </Tabs>
  );
}
