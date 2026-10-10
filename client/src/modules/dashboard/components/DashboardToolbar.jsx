import { useState } from "react";
import {
  Alert,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";

import DashboardCustomizeMenu from "./DashboardCustomizeMenu";

export default function DashboardToolbar({
  title,
  generatedAt,
  onRefresh,
  onReset,
  refreshing = false,
  saving = false,
  isCustomizing = false,
  onStartCustomization,
  onFinishCustomization,
  widgets = [],
  metrics = [],
  onToggleWidget,
  saveError = "",
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const labeledWidgets = widgets.map((widget) => ({
    ...widget,
    label:
      widget.label ??
      metrics.find((metric) => metric.code === widget.id)?.label ??
      metrics.find((metric) => metric.code === widget.id)?.name ??
      widget.id,
  }));

  const handleCustomizationClick = () => {
    if (isCustomizing) {
      setMenuAnchor(null);
      onFinishCustomization?.();
      return;
    }

    onStartCustomization?.();
  };

  return (
    <Stack spacing={1.25} sx={{ minWidth: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {generatedAt
              ? `Updated ${new Date(generatedAt).toLocaleString()}`
              : "Loading dashboard"}
            {saving ? " · Saving layout…" : ""}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
        >
          {isCustomizing && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<WidgetsOutlinedIcon />}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              disabled={!widgets.length}
            >
              Manage widgets
            </Button>
          )}

          <Button
            variant={isCustomizing ? "contained" : "outlined"}
            size="small"
            startIcon={isCustomizing ? <CheckRoundedIcon /> : <TuneRoundedIcon />}
            onClick={handleCustomizationClick}
            disabled={saving}
          >
            {isCustomizing ? "Done" : "Customize layout"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>

          <Button
            variant="text"
            size="small"
            startIcon={<RestartAltRoundedIcon />}
            onClick={onReset}
            disabled={saving}
          >
            Reset layout
          </Button>
        </Stack>
      </Stack>

      {isCustomizing && (
        <Alert severity="info" variant="outlined">
          Drag cards using their handle. Resize from a bottom corner. Your layout is saved automatically; select Done when you finish.
        </Alert>
      )}

      {saveError && (
        <Alert severity="warning" variant="outlined">
          {saveError}
        </Alert>
      )}

      <DashboardCustomizeMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        widgets={labeledWidgets}
        onToggle={onToggleWidget}
      />
    </Stack>
  );
}
