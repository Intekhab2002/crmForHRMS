import { Box, Card, CardContent, Stack } from "@mui/material";
import EmptyMetricState from "./EmptyMetricState";
import MetricErrorState from "./MetricErrorState";
import MetricHeader from "./MetricHeader";
import DashboardChart from "../charts/DashboardChart";

export default function ChartCard({
  metric,
  viewMode,
  viewModes,
  onViewChange,
  isCustomizing = false,
}) {
  const data = Array.isArray(metric?.data) ? metric.data : [];
  const error = metric?.metadata?.error;

  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isCustomizing ? "100%" : "auto",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        borderTop: 3,
        borderTopColor: "primary.main",
      }}
    >
      <CardContent
        sx={{
          boxSizing: "border-box",
          display: "flex",
          flex: isCustomizing ? 1 : "0 0 auto",
          flexDirection: "column",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        <Stack
          spacing={1.5}
          sx={{
            height: isCustomizing ? "100%" : "auto",
            minWidth: 0,
            minHeight: 0,
          }}
        >
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
            <Box
              sx={{
                flex: isCustomizing ? 1 : "0 0 auto",
                minWidth: 0,
                minHeight: 0,
                overflow: isCustomizing ? "auto" : "visible",
              }}
            >
              <DashboardChart metric={metric} />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
