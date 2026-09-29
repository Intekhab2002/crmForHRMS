import { Card, CardContent, Stack, Typography } from "@mui/material";
import EmptyMetricState from "./EmptyMetricState";
import MetricErrorState from "./MetricErrorState";
import DashboardChart from "../charts/DashboardChart";

export default function ChartCard({ metric }) {
  const data = Array.isArray(metric?.data) ? metric.data : [];
  const error = metric?.metadata?.error;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {metric.label}
          </Typography>

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
