import { Box } from "@mui/material";
import { useState } from "react";

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

export default function DashboardWidget({
  metric,
  onDrillDown,
  isCustomizing = false,
}) {
  const viewModes = getViewModes(metric);

  const [selectedViewMode, setSelectedViewMode] = useState(() =>
    getDefaultView(metric, viewModes),
  );

  const viewMode = viewModes.includes(selectedViewMode)
    ? selectedViewMode
    : getDefaultView(metric, viewModes);
  let content;
  if (viewMode === "kpi") {
    content = <MetricCard metric={metric} onClick={onDrillDown} />;
  } else if (viewMode === "table") {
    content = (
      <DataTableCard
        metric={metric}
        viewMode={viewMode}
        viewModes={viewModes}
        onViewChange={setSelectedViewMode}
        isCustomizing={isCustomizing}
      />
    );
  } else {
    content = (
      <ChartCard
        metric={metric}
        viewMode={viewMode}
        viewModes={viewModes}
        onViewChange={setSelectedViewMode}
      />
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "auto",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        "& > *": {
          minWidth: 0,
          flex: 1,
        },
      }}
    >
      {content}
    </Box>
  );
}
