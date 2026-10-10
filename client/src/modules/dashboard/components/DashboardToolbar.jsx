import { Button, Stack, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

export default function DashboardToolbar({
    title, generatedAt, onRefresh, onReset, refreshing, saving,
    isCustomizing, onStartCustomization, onFinishCustomization,
    widgets, onToggleWidget
}) {

  
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
      <Stack>
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {generatedAt ? `Updated ${new Date(generatedAt).toLocaleString()}` : "Loading dashboard"}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={onRefresh} disabled={refreshing}>
          Refresh
        </Button>
        <Button variant="text" size="small" startIcon={<RestartAltRoundedIcon />} onClick={onReset} disabled={saving}>
          Reset Layout
        </Button>
      </Stack>
    </Stack>
  );
}
