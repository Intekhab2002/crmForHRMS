import { useMemo } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getChartPalette, getChartData } from "./chart.utils";

function getSeries(metric, data) {
  const configuredSeries = metric?.metadata?.chart?.series;

  if (Array.isArray(configuredSeries) && configuredSeries.length > 0) {
    return configuredSeries;
  }

  if (!data.length) return [];

  const excludedKeys = new Set([
    metric?.metadata?.chart?.xAxisKey,
    "key",
    "label",
  ]);

  return Object.keys(data[0])
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

function truncateLabel(value, maxLength = 18) {
  const text = String(value ?? "");
  return text.length > maxLength
    ? `${text.slice(0, maxLength - 1)}…`
    : text;
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
  const dense = data.length >= 12;

  /*
   * Keep vertical columns for large categorical datasets.
   * Instead of switching to horizontal bars, make the plotting surface
   * horizontally scrollable so every category remains represented.
   */
  const chartWidth = dense
    ? Math.max(720, data.length * 72)
    : "100%";

  const chartHeight = dense ? 380 : 280;

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: dense ? "auto" : "hidden",
        overflowY: "hidden",
      }}
    >
      <Box sx={{ width: chartWidth, minWidth: dense ? 720 : "100%" }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <RechartsBarChart
            data={data}
            margin={{
              top: 8,
              right: 20,
              left: 0,
              bottom: dense ? 68 : 8,
            }}
          >
            <CartesianGrid
              stroke={theme.palette.divider}
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey={xAxisKey}
              interval={0}
              height={dense ? 72 : 30}
              angle={dense ? -35 : 0}
              textAnchor={dense ? "end" : "middle"}
              tickFormatter={(value) =>
                dense ? truncateLabel(value) : value
              }
              tick={{
                fill: theme.palette.text.secondary,
                fontSize: 11,
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
              labelFormatter={(label) => String(label ?? "")}
              formatter={(value, name) => [value, name]}
              contentStyle={{
                borderRadius: theme.shape.borderRadius,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />

            {series.length > 1 && (
              <Legend verticalAlign="bottom" height={36} />
            )}

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
      </Box>
    </Box>
  );
}
