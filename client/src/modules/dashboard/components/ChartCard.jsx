import { Card, CardContent, Stack, Typography } from "@mui/material";
import EmptyMetricState from "./EmptyMetricState";

export default function ChartCard({ metric }) {
  const data = Array.isArray(metric?.data) ? metric.data : [];

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {metric.label}
          </Typography>
          {!data.length ? (
            <EmptyMetricState />
          ) : (
            <Stack spacing={0.75}>
              {data.slice(0, 10).map((item) => (
                <Stack key={String(item.key ?? item.date)} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {item.key ?? item.date}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {item.value ?? `${item.created} / ${item.closed}`}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
