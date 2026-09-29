import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getChartPalette, getChartData } from "./chart.utils";

export default function BarChart({ metric }) {
  const theme = useTheme();
  const data = getChartData(metric);
  const palette = useMemo(() => getChartPalette(theme), [theme]);

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
          dataKey="key"
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
          formatter={(value) => [value, "Tickets"]}
          contentStyle={{
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
          }}
        />

        <Bar
          dataKey="value"
          name={metric?.label || "Value"}
          radius={[4, 4, 0, 0]}
          isAnimationActive
        >
          {data.map((entry, index) => (
            <Cell
              key={`${entry.key ?? "item"}-${index}`}
              fill={palette[index % palette.length]}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
