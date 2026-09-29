import { useTheme } from "@mui/material/styles";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartDate, getChartData } from "./chart.utils";

export default function LineChart({ metric }) {
  const theme = useTheme();
  const data = getChartData(metric);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLineChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid
          stroke={theme.palette.divider}
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tickFormatter={formatChartDate}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          axisLine={{ stroke: theme.palette.divider }}
          tickLine={false}
        />

        <YAxis
          allowDecimals={false}
          width={36}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          labelFormatter={formatChartDate}
          contentStyle={{
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
          }}
        />

        <Legend verticalAlign="bottom" height={36} />

        <Line
          type="monotone"
          dataKey="created"
          name="Created"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          isAnimationActive
        />

        <Line
          type="monotone"
          dataKey="closed"
          name="Closed"
          stroke={theme.palette.success.main}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          isAnimationActive
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
