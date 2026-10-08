import { useState } from "react";
import {
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import DataTableCard from "./DataTableCard";

function getViewModes(metric) {
  if (Array.isArray(metric?.viewModes) && metric.viewModes.length) {
    return metric.viewModes;
  }

  if (metric?.visualization === "kpi") {
    return ["kpi"];
  }

  return ["graph", "table"];
}

function getDefaultView(metric, viewModes) {
  if (metric?.defaultView && viewModes.includes(metric.defaultView)) {
    return metric.defaultView;
  }

  if (metric?.visualization === "kpi") {
    return "kpi";
  }

  return viewModes.includes("graph") ? "graph" : viewModes[0];
}

export default function DashboardWidget({ metric, onDrillDown, size }) {
  const viewModes = getViewModes(metric);

  const [viewMode, setViewMode] = useState(() =>
    getDefaultView(metric, viewModes),
  );

  const isToggleVisible =
    viewModes.includes("graph") &&
    viewModes.includes("table");

  const content = (() => {
    if (viewMode === "kpi") {
      return <MetricCard metric={metric} onClick={onDrillDown} />;
    }

    if (viewMode === "table") {
      return <DataTableCard metric={metric} />;
    }

    return <ChartCard metric={metric} />;
  })();

  return (
    <Grid size={size}>
      <Stack spacing={1} sx={{ height: "100%" }}>
        {isToggleVisible && (
          <Stack direction="row" justifyContent="flex-end">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={(_, next) => {
                if (next && viewModes.includes(next)) {
                  setViewMode(next);
                }
              }}
              aria-label={`${metric.label} view mode`}
            >
              <ToggleButton value="graph" aria-label="Graph view">
                Graph
              </ToggleButton>

              <ToggleButton value="table" aria-label="Table view">
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {content}
      </Stack>
    </Grid>
  );
}