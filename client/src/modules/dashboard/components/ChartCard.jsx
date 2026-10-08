import { Card, CardContent, Stack } from "@mui/material";
import EmptyMetricState from "./EmptyMetricState";
import MetricErrorState from "./MetricErrorState";
import MetricHeader from "./MetricHeader";
import DashboardChart from "../charts/DashboardChart";

export default function ChartCard({
  metric,
  viewMode,
  viewModes,
  onViewChange,
}) {
  const data = Array.isArray(metric?.data) ? metric.data : [];
  const error = metric?.metadata?.error;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderTop: 3,
        borderTopColor: "primary.main",
      }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={1.5} sx={{ height: "100%", minWidth: 0 }}>
          <MetricHeader
            metric={metric}
            viewMode={viewMode}
            viewModes={viewModes}
            onViewChange={onViewChange}
          />

          {error ? (
            <MetricErrorState message={error.message} />
          ) : !data.length ? (
            <EmptyMetricState />
          ) : (
            <DashboardChart metric={metric} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
