import { Grid, Paper, Stack, Typography } from "@mui/material";
import DashboardWidget from "./DashboardWidget";

const sizeByWidth = (widget) => {
  if (widget.w >= 12) return { xs: 12 };
  if (widget.w >= 6) return { xs: 12, md: 6 };
  return { xs: 12, sm: 6, lg: 3 };
};

export default function DashboardGrid({ metrics, layout, onDrillDown }) {
  const metricMap = new Map(metrics.map((metric) => [metric.code, metric]));
  const widgets = [...layout.widgets]
    .filter((widget) => widget.visible !== false)
    .sort((a, b) => a.order - b.order);

  if (!widgets.length) {
    return (
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack alignItems="center">
          <Typography color="text.secondary">No widgets are configured for this dashboard.</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {widgets.map((widget) => {
        const metric = metricMap.get(widget.id);
        if (!metric) return null;

        return (
          <DashboardWidget
            key={widget.id}
            metric={metric}
            onDrillDown={onDrillDown}
            size={sizeByWidth(widget)}
          />
        );
      })}
    </Grid>
  );
}
