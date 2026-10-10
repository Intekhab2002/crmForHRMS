
import {
  Box,
  ButtonBase,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import MetricInfo from "./MetricInfo";
import {
  getMetricStatus,
  getMetricStatusColor,
} from "../utils/metricStatus";

export default function MetricCard({ metric, onClick }) {
  const theme = useTheme();

  const clickable = Boolean(metric?.drillDown?.route);
  const status = getMetricStatus(metric);
  const tone = getMetricStatusColor(status, theme);

  const value =
    metric?.value == null || metric.value === ""
      ? "—"
      : metric.value;

  const displayValue =
    metric?.unit === "percent" && metric?.value != null
      ? `${value}%`
      : value;

  const statusLabel = {
    good: "Healthy",
    warning: "Needs attention",
    critical: "Critical",
    neutral: "No status threshold configured",
  }[status] ?? "Unknown";

  const handleDrillDown = () => {
    if (clickable) {
      onClick?.(metric);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        minWidth: 0,
        borderRadius: 3,
        borderColor: "divider",
        borderTop: 3,
        borderTopColor: tone,
        background: `linear-gradient(
          135deg,
          ${theme.palette.background.paper} 0%,
          ${alpha(tone, 0.055)} 100%
        )`,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          borderColor: alpha(tone, 0.45),
          boxShadow: "0 5px 16px rgba(15, 23, 42, 0.07)",
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.25 },
          "&:last-child": {
            pb: { xs: 2, sm: 2.25 },
          },
        }}
      >
        <Stack spacing={1.1} sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ minWidth: 0 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={700}
              noWrap
              title={metric?.label}
              sx={{
                minWidth: 0,
                flex: 1,
                lineHeight: 1.5,
              }}
            >
              {metric?.label ?? "Untitled metric"}
            </Typography>

            {/* Independent of metric drill-down availability */}
            <MetricInfo metric={metric} />

            <Box
              component="span"
              role="img"
              aria-label={`Metric status: ${statusLabel}`}
              title={`Status: ${statusLabel}`}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: tone,
                flexShrink: 0,
                boxShadow: `0 0 0 3px ${alpha(tone, 0.12)}`,
              }}
            />
          </Stack>

          {clickable ? (
            <ButtonBase
              onClick={handleDrillDown}
              aria-label={`View details for ${metric?.label}`}
              sx={{
                alignSelf: "flex-start",
                borderRadius: 1,
                textAlign: "left",
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 3,
                },
              }}
            >
              <Typography
                variant="h4"
                component="span"
                fontWeight={800}
                sx={{
                  color: tone,
                  lineHeight: 1.2,
                  letterSpacing: "-0.035em",
                  fontSize: { xs: "1.75rem", sm: "2rem" },
                  overflowWrap: "anywhere",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayValue}
              </Typography>
            </ButtonBase>
          ) : (
            <Typography
              variant="h4"
              component="div"
              fontWeight={800}
              sx={{
                color: tone,
                lineHeight: 1.2,
                letterSpacing: "-0.035em",
                fontSize: { xs: "1.75rem", sm: "2rem" },
                overflowWrap: "anywhere",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {displayValue}
            </Typography>
          )}

          {metric?.metadata?.numerator !== undefined && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.5 }}
            >
              {metric.metadata.numerator} met /{" "}
              {metric.metadata.denominator ?? 0} eligible
            </Typography>
          )}

          {status === "neutral" && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.4 }}
            >
              Threshold not configured
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
