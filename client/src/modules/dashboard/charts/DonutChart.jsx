import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
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

  const palette = useMemo(
    () => getChartPalette(theme),
    [theme],
  );

  const total = useMemo(
    () =>
      data.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0,
      ),
    [data],
  );

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 280,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
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
            formatter={(value, _name, item) => [
              value,
              item?.payload?.key ?? metric?.label ?? "Value",
            ]}
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

      <Stack
        spacing={0}
        alignItems="center"
        justifyContent="center"
        sx={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          lineHeight={1.1}
        >
          {total}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          lineHeight={1.2}
        >
          Total
        </Typography>
      </Stack>
    </Box>
  );
}