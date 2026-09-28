import { Alert, Paper, Stack } from "@mui/material";
import { Outlet } from "react-router";
import DashboardTabs from "../components/DashboardTabs";

export default function DashboardPage() {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ px: 1 }}>
        <DashboardTabs />
      </Paper>
      <Outlet />
    </Stack>
  );
}
