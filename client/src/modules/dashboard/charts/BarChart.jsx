import { useMemo } from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import { getChartPalette, getChartData } from "./chart.utils";

const HORIZONTAL_THRESHOLD = 10;
const ROW_HEIGHT = 32;
const MIN_CHART_HEIGHT = 260;
const MAX_CHART_HEIGHT = 460;

function getSeries(metric, data) {
  const configured = metric?.metadata?.chart?.series;

  if (Array.isArray(configured) && configured.length) {
    return configured;
  }

  if (!data.length) return [];

  const xAxisKey = metric?.metadata?.chart?.xAxisKey || "label";
  const excluded = new Set([xAxisKey, "key", "label"]);

  return Object.keys(data[0])
    .filter((key) => !excluded.has(key))
    .filter((key) =>
      data.some(
        (row) => typeof row?.[key] === "number" && Number.isFinite(row[key]),
      ),
    )
    .map((dataKey) => ({
      dataKey,
      name: dataKey,
    }));
}

function formatLabel(value, maxLength = 22) {
  const label = String(value ?? "");
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function ChartTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;

  return (
    <Box
      sx={{
        minWidth: 140,
        p: 1.25,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: theme.shadows[4],
      }}
    >
      <Box
        sx={{
          mb: 0.75,
          fontSize: 12,
          fontWeight: 700,
          color: "text.primary",
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </Box>

      {payload.map((item) => (
        <Box
          key={item.dataKey}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            py: 0.25,
            fontSize: 12,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: item.color,
                flexShrink: 0,
              }}
            />
            <Box sx={{ color: "text.secondary" }}>{item.name}</Box>
          </Box>

          <Box sx={{ fontWeight: 700, color: "text.primary" }}>
            {item.value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function BarChart({ metric }) {
  const theme = useTheme();
  const data = getChartData(metric);

  const palette = useMemo(() => getChartPalette(theme), [theme]);

  const chartConfig = metric?.metadata?.chart ?? {};
  const xAxisKey = chartConfig.xAxisKey || "label";
  const series = getSeries(metric, data);

  const horizontal =
    chartConfig.orientation === "horizontal" ||
    (chartConfig.orientation !== "vertical" &&
      data.length >= HORIZONTAL_THRESHOLD);

  const chartHeight = horizontal
    ? Math.min(
        MAX_CHART_HEIGHT,
        Math.max(MIN_CHART_HEIGHT, data.length * ROW_HEIGHT + 76),
      )
    : 300;

  const formatValue = (value) =>
    Number.isFinite(Number(value))
      ? new Intl.NumberFormat().format(Number(value))
      : value;

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        flex: "0 0 auto",
        "& .recharts-wrapper:focus, & .recharts-surface:focus": {
          outline: "none",
        },
      }}
    >
      <Box sx={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{
              top: 8,
              right: 20,
              bottom: series.length > 1 ? 8 : 4,
              left: horizontal ? 8 : 0,
            }}
            barCategoryGap={horizontal ? "24%" : "22%"}
            barGap={5}
          >
            <CartesianGrid
              stroke={alpha(theme.palette.text.primary, 0.09)}
              strokeDasharray="3 5"
              vertical={horizontal}
              horizontal={!horizontal}
            />

            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickFormatter={formatValue}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  width={125}
                  tickFormatter={(value) => formatLabel(value, 20)}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  interval={0}
                  tickFormatter={(value) => formatLabel(value, 18)}
                  tick={{
                    fill: theme.palette.text.secondary,
                    fontSize: 11,
                  }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={formatValue}
                  width={42}
                  tick={{
                    fill: theme.palette.text.secondary,
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
              </>
            )}

            <Tooltip
              cursor={{
                fill: alpha(theme.palette.primary.main, 0.055),
              }}
              content={(props) => <ChartTooltip {...props} theme={theme} />}
            />

            {series.length > 1 && (
              <Legend
                verticalAlign="bottom"
                align="center"
                height={32}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 8,
                }}
              />
            )}

            {series.map((item, index) => (
              <Bar
                key={item.dataKey}
                dataKey={item.dataKey}
                name={item.name || item.dataKey}
                fill={palette[index % palette.length]}
                radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]}
                maxBarSize={horizontal ? 20 : 38}
                isAnimationActive={data.length < 30}
                animationDuration={450}
              >
                {series.length === 1 &&
                  data.map((entry, dataIndex) => (
                    <Cell
                      key={`cell-${entry[xAxisKey] ?? dataIndex}`}
                      fill={palette[dataIndex % palette.length]}
                    />
                  ))}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
