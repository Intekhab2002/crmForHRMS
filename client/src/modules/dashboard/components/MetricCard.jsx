import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function getMetricTone(metric, theme) {
  const code = String(metric?.code || "").toLowerCase();
  const label = String(metric?.label || "").toLowerCase();

  if (
    code.includes("breach") ||
    code.includes("risk") ||
    label.includes("breach") ||
    label.includes("risk")
  ) {
    return theme.palette.error.main;
  }

  if (
    code.includes("compliance") ||
    code.includes("met") ||
    label.includes("compliance")
  ) {
    return theme.palette.success.main;
  }

  if (code.startsWith("tickets.") || code.startsWith("p")) {
    return theme.palette.info.main;
  }

  return theme.palette.primary.main;
}

export default function MetricCard({ metric, onClick }) {
  const theme = useTheme();
  const clickable = Boolean(metric?.drillDown?.route);
  const tone = getMetricTone(metric, theme);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderTop: 3,
        borderTopColor: tone,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${tone}0D 100%)`,
      }}
    >
      <CardActionArea
        disabled={!clickable}
        onClick={() => onClick?.(metric)}
        sx={{
          height: "100%",
          cursor: clickable ? "pointer" : "default",
        }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
                noWrap
                sx={{ minWidth: 0 }}
              >
                {metric.label}
              </Typography>

              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: tone,
                  flexShrink: 0,
                }}
              />
            </Stack>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ color: tone }}
            >
              {metric.value ?? "—"}
              {metric.unit === "percent" && metric.value !== null ? "%" : ""}
            </Typography>

            {metric.metadata?.numerator !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {metric.metadata.numerator} met /{" "}
                {metric.metadata.denominator ?? 0} eligible
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
