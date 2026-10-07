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

const DEFAULT_X_AXIS_KEY = "date";

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
    "date",
    "period",
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

export default function LineChart({ metric }) {
  const theme = useTheme();

  const data = getChartData(metric);

  const xAxisKey =
    metric?.metadata?.chart?.xAxisKey ||
    (data.some((item) => item?.period != null)
      ? "period"
      : DEFAULT_X_AXIS_KEY);

  const series = getSeries(metric, data);

  if (!series.length) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLineChart
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
          tickFormatter={formatChartDate}
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
          allowDecimals
          width={48}
          tick={{
            fill: theme.palette.text.secondary,
            fontSize: 12,
          }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          labelFormatter={formatChartDate}
          formatter={(value, name) => [
            value,
            name,
          ]}
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
          <Line
            key={item.dataKey}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name || item.dataKey}
            stroke={
              [
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.success.main,
                theme.palette.warning.main,
                theme.palette.error.main,
                theme.palette.info.main,
              ][index % 6]
            }
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}