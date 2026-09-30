import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@mui/material/styles";

import { getChartData } from "./chart.utils";

export default function HistogramChart({ metric }) {
  const theme = useTheme();

  const data = getChartData(metric).map((item) => ({
    ...item,
    label: item.label ?? item.key ?? "",
    value: Number(item.value ?? item.count ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid
          stroke={theme.palette.divider}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
          axisLine={{ stroke: theme.palette.divider }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [value, "Runs"]}
          contentStyle={{
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
          }}
        />
        <Bar
          dataKey="value"
          name="Runs"
          fill={theme.palette.primary.main}
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
