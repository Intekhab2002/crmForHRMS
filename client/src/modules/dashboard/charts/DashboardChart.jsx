import { Alert } from "@mui/material";

import BarChart from "./BarChart";
import DonutChart from "./DonutChart";
import LineChart from "./LineChart";
import HistogramChart from "./HistogramChart";
import TreemapChart from "./TreemapChart";
import { getChartData } from "./chart.utils";

const CHART_COMPONENTS = Object.freeze({
  donut: DonutChart,
  bar: BarChart,
  line: LineChart,
  histogram: HistogramChart,
  treemap: TreemapChart,
});

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

  return <ChartComponent metric={metric} />;
}
