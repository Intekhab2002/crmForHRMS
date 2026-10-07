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

export default function DashboardWidget({ metric, onDrillDown, size }) {
  const [viewMode, setViewMode] = useState(
    metric?.visualization === "kpi" ? "graph" : "graph",
  );

  const isVisualMetric = metric?.visualization !== "kpi";

  const content = (() => {
    if (metric?.visualization === "kpi") {
      return <MetricCard metric={metric} onClick={onDrillDown} />;
    }

    return viewMode === "table" ? (
      <DataTableCard metric={metric} />
    ) : (
      <ChartCard metric={metric} />
    );
  })();

  return (
    <Grid size={size}>
      <Stack spacing={1} sx={{ height: "100%" }}>
        {isVisualMetric && (
          <Stack direction="row" justifyContent="flex-end">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={(_, next) => {
                if (next) {
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
