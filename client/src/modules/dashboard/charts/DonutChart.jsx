import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getChartPalette, getChartData } from "./chart.utils";

export default function DonutChart({ metric }) {
  const theme = useTheme();
  const data = getChartData(metric);
  const palette = useMemo(() => getChartPalette(theme), [theme]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius="58%"
          outerRadius="78%"
          paddingAngle={2}
          minAngle={2}
          isAnimationActive
        >
          {data.map((entry, index) => (
            <Cell
              key={`${entry.key ?? "item"}-${index}`}
              fill={palette[index % palette.length]}
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value) => [value, "Tickets"]}
          contentStyle={{
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
          }}
        />

        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
