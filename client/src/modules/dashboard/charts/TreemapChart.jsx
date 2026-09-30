import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { useTheme } from "@mui/material/styles";

import { getChartData, getChartPalette } from "./chart.utils";

export default function TreemapChart({ metric }) {
  const theme = useTheme();
  const palette = getChartPalette(theme);

  const data = getChartData(metric)
    .map((item) => ({
      name: item.label ?? item.key ?? "Unknown",
      size: Number(item.value ?? 0),
    }))
    .filter((item) => item.size > 0)
    .slice(0, 20);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Treemap
        data={data}
        dataKey="size"
        nameKey="name"
        stroke={theme.palette.background.paper}
        fill={palette[0]}
        isAnimationActive
      >
        <Tooltip
          formatter={(value) => [value, "Tickets"]}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}
