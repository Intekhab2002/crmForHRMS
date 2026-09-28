import { Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";

export default function MetricCard({ metric, onClick }) {
  const clickable = Boolean(metric?.drillDown?.route);

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        disabled={!clickable}
        onClick={() => onClick?.(metric)}
        sx={{ height: "100%", cursor: clickable ? "pointer" : "default" }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {metric.label}
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {metric.value ?? "—"}
              {metric.unit === "percent" && metric.value !== null ? "%" : ""}
            </Typography>
            {metric.metadata?.numerator !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {metric.metadata.numerator} met / {metric.metadata.denominator ?? 0} eligible
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
