import { Alert, Box, CircularProgress } from "@mui/material";
import { lazy, Suspense } from "react";

// import BarChart from "./BarChart";
// import DonutChart from "./DonutChart";
// import LineChart from "./LineChart";
// import HistogramChart from "./HistogramChart";
// import TreemapChart from "./TreemapChart";
import { getChartData } from "./chart.utils";

const CHART_COMPONENTS = Object.freeze({
  donut: lazy(() => import("./DonutChart")),
  bar: lazy(() => import("./BarChart")),
  line: lazy(() => import("./LineChart")),
  histogram: lazy(() => import("./HistogramChart")),
  treemap: lazy(() => import("./TreemapChart")),
});

function ChartLoadingFallback() {
  return (
    <Box
      role="status"
      aria-label="Loading chart"
      sx={{
        height: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={24} />
    </Box>
  );
}

export default function DashboardChart({ metric }) {
  const data = getChartData(metric);
  const ChartComponent = CHART_COMPONENTS[metric?.visualization];

  if (!data.length) {
    return (
      <Alert severity="info" variant="outlined">
        No data is available for this chart.
      </Alert>
    );
  }

  if (!ChartComponent) {
    return (
      <Alert severity="warning" variant="outlined">
        Visualization "{metric?.visualization || "unknown"}" is not supported.
      </Alert>
    );
  }

  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ChartComponent metric={metric} />
    </Suspense>
  );
}
