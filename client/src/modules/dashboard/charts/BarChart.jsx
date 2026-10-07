import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getChartPalette,
  getChartData,
} from "./chart.utils";

function getSeries(metric, data) {
  const configuredSeries = metric?.metadata?.chart?.series;

  if (Array.isArray(configuredSeries) && configuredSeries.length > 0) {
    return configuredSeries;
  }

  if (!data.length) {
    return [];
  }

  const excludedKeys = new Set([
    metric?.metadata?.chart?.xAxisKey,
    "key",
    "label",
  ]);

  const firstRow = data[0];

  return Object.keys(firstRow)
    .filter((key) => !excludedKeys.has(key))
    .filter((key) =>
      data.some(
        (row) =>
          typeof row?.[key] === "number" &&
          Number.isFinite(row[key]),
      ),
    )
    .map((dataKey) => ({
      dataKey,
      name: dataKey,
      unit: "count",
    }));
}

export default function BarChart({ metric }) {
  const theme = useTheme();

  const data = getChartData(metric);

  const palette = useMemo(
    () => getChartPalette(theme),
    [theme],
  );

  const xAxisKey =
    metric?.metadata?.chart?.xAxisKey || "label";

  const series = getSeries(metric, data);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 8,
          right: 16,
          left: 0,
          bottom: 8,
        }}
      >
        <CartesianGrid
          stroke={theme.palette.divider}
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          dataKey={xAxisKey}
          tick={{
            fill: theme.palette.text.secondary,
            fontSize: 12,
          }}
          axisLine={{
            stroke: theme.palette.divider,
          }}
          tickLine={false}
        />

        <YAxis
          allowDecimals={false}
          width={48}
          tick={{
            fill: theme.palette.text.secondary,
            fontSize: 12,
          }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          contentStyle={{
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
          }}
        />

        <Legend
          verticalAlign="bottom"
          height={36}
        />

        {series.map((item, index) => (
          <Bar
            key={item.dataKey}
            dataKey={item.dataKey}
            name={item.name || item.dataKey}
            fill={palette[index % palette.length]}
            radius={[4, 4, 0, 0]}
            isAnimationActive
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}