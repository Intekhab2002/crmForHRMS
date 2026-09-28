import { Grid } from "@mui/material";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import DataTableCard from "./DataTableCard";

export default function DashboardWidget({ metric, onDrillDown, size }) {
  const content = (() => {
    switch (metric.visualization) {
      case "table":
        return <DataTableCard metric={metric} />;
      case "donut":
      case "bar":
      case "line":
      case "histogram":
      case "scatter":
      case "treemap":
        return <ChartCard metric={metric} />;
      default:
        return <MetricCard metric={metric} onClick={onDrillDown} />;
    }
  })();

  return (
    <Grid size={size}>
      {content}
    </Grid>
  );
}
