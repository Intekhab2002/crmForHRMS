import { useEffect, useState } from "react";
import { Grid, Stack } from "@mui/material";

import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import DataTableCard from "./DataTableCard";

function getViewModes(metric) {
  if (Array.isArray(metric?.viewModes) && metric.viewModes.length) {
    return metric.viewModes;
  }

  if (metric?.visualization === "kpi") return ["kpi"];
  if (metric?.visualization === "table") return ["table"];

  return ["graph", "table"];
}

function getDefaultView(metric, viewModes) {
  if (metric?.defaultView && viewModes.includes(metric.defaultView)) {
    return metric.defaultView;
  }

  if (metric?.visualization === "kpi") return "kpi";
  if (metric?.visualization === "table") return "table";

  return viewModes.includes("graph") ? "graph" : viewModes[0];
}

export default function DashboardWidget({ metric, onDrillDown, size }) {
  const viewModes = getViewModes(metric);
  const [viewMode, setViewMode] = useState(() =>
    getDefaultView(metric, viewModes),
  );

  useEffect(() => {
    if (!viewModes.includes(viewMode)) {
      setViewMode(getDefaultView(metric, viewModes));
    }
  }, [metric?.code, metric?.defaultView, metric?.visualization, viewModes, viewMode]);

  const content = (() => {
    if (viewMode === "kpi") {
      return (
        <MetricCard
          metric={metric}
          onClick={onDrillDown}
        />
      );
    }

    if (viewMode === "table") {
      return (
        <DataTableCard
          metric={metric}
          viewMode={viewMode}
          viewModes={viewModes}
          onViewChange={setViewMode}
        />
      );
    }

    return (
      <ChartCard
        metric={metric}
        viewMode={viewMode}
        viewModes={viewModes}
        onViewChange={setViewMode}
      />
    );
  })();

  return (
    <Grid size={size}>
      <Stack spacing={1.5} sx={{ height: "100%", minWidth: 0 }}>
        {content}
      </Stack>
    </Grid>
  );
}
