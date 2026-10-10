
import { useState } from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function formatValue(value, unit) {
  if (!hasValue(value)) return "Not configured";

  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);

    if (unit === "percent") return `${formatted}%`;
    if (unit === "minutes") return `${formatted} minutes`;
    if (unit === "score") return formatted;

    return formatted;
  }

  return String(value);
}

function InfoSection({ title, children }) {
  if (!hasValue(children)) return null;

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        display="block"
        sx={{ mb: 0.25 }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ overflowWrap: "anywhere", lineHeight: 1.55 }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function ThresholdRow({ label, value, unit, color }) {
  if (!hasValue(value)) return null;

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Chip
        size="small"
        label={formatValue(value, unit)}
        color={color}
        variant="outlined"
        sx={{ fontWeight: 700, maxWidth: "65%" }}
      />
    </Stack>
  );
}

export default function MetricInfo({ metric }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const definition = metric?.metadata?.definition ?? {};
  const thresholds = definition.thresholds ?? metric?.metadata?.thresholds ?? {};

  const description =
    definition.description ?? metric?.description;

  const calculation = definition.calculation;
  const interpretation = definition.interpretation;
  const dataSource = definition.dataSource;

  const idealValue =
    definition.idealValue ?? thresholds.idealValue;

  const minimum =
    definition.minimum ?? thresholds.minimum;

  const maximum =
    definition.maximum ?? thresholds.maximum;

  const target =
    definition.target ?? thresholds.target;

  const belowTarget = definition.belowTarget;
  const aboveTarget = definition.aboveTarget;

  const unit = definition.unit ?? metric?.unit;

  const direction =
    definition.direction ?? thresholds.direction;

  const handleOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const hasDetails = [
    description,
    calculation,
    interpretation,
    dataSource,
    idealValue,
    minimum,
    maximum,
    target,
    belowTarget,
    aboveTarget,
    direction,
  ].some(hasValue);

  if (!hasDetails) return null;

  return (
    <>
      <Tooltip title={`About ${metric?.label ?? "this metric"}`}>
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-label={`About ${metric?.label ?? "metric"}`}
          aria-haspopup="dialog"
          aria-expanded={Boolean(anchorEl)}
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            color: "text.secondary",
            "&:hover": {
              bgcolor: "action.hover",
              color: "primary.main",
            },
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "calc(100vw - 32px)", sm: 420 },
              maxWidth: 420,
              maxHeight: "min(75vh, 620px)",
              overflowY: "auto",
              p: 2.25,
              borderRadius: 2.5,
            },
          },
        }}
      >
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              {metric?.label ?? "Metric information"}
            </Typography>

            {hasValue(direction) && (
              <Typography variant="caption" color="text.secondary">
                Performance direction: {direction}
              </Typography>
            )}
          </Box>

          <Divider />

          <InfoSection title="What does this metric mean?">
            {description}
          </InfoSection>

          <InfoSection title="How is it calculated?">
            {calculation}
          </InfoSection>

          <InfoSection title="How should I interpret it?">
            {interpretation}
          </InfoSection>

          {(hasValue(idealValue) ||
            hasValue(minimum) ||
            hasValue(maximum) ||
            hasValue(target)) && (
            <>
              <Divider />

              <Typography variant="subtitle2" fontWeight={800}>
                Expected values
              </Typography>

              <Stack spacing={1}>
                <ThresholdRow
                  label="Ideal value"
                  value={idealValue}
                  unit={unit}
                  color="success"
                />

                <ThresholdRow
                  label="Minimum acceptable"
                  value={minimum}
                  unit={unit}
                  color="info"
                />

                <ThresholdRow
                  label="Maximum acceptable"
                  value={maximum}
                  unit={unit}
                  color="warning"
                />

                <ThresholdRow
                  label="Target"
                  value={target}
                  unit={unit}
                  color="primary"
                />
              </Stack>
            </>
          )}

          <InfoSection title="What to check if below target">
            {belowTarget}
          </InfoSection>

          <InfoSection title="What to check if above target">
            {aboveTarget}
          </InfoSection>

          {hasValue(dataSource) && (
            <>
              <Divider />
              <InfoSection title="Data source">
                {dataSource}
              </InfoSection>
            </>
          )}

          {!hasValue(idealValue) &&
            !hasValue(minimum) &&
            !hasValue(maximum) &&
            !hasValue(target) && (
              <Typography variant="caption" color="text.secondary">
                Expected values have not been configured for this metric.
              </Typography>
            )}
        </Stack>
      </Popover>
    </>
  );
}
