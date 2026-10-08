import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import MetricInfo from "./MetricInfo";

export default function MetricHeader({
  metric,
  viewMode,
  viewModes = [],
  onViewChange,
}) {
  const canToggle =
    viewModes.includes("graph") && viewModes.includes("table");

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ minWidth: 0 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ minWidth: 0 }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={800}
          noWrap
          title={metric?.label}
          sx={{ minWidth: 0 }}
        >
          {metric?.label}
        </Typography>

        <MetricInfo metric={metric} />
      </Stack>

      {canToggle && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, next) => {
            if (next && viewModes.includes(next)) {
              onViewChange?.(next);
            }
          }}
          aria-label={`${metric?.label} view mode`}
          sx={{
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              px: 1,
              minWidth: 34,
              borderRadius: 1.5,
            },
          }}
        >
          <ToggleButton value="graph" aria-label="Graph view">
            <BarChartOutlinedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="table" aria-label="Table view">
            <TableViewOutlinedIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      )}
    </Stack>
  );
}
