import { Alert, Paper, Stack } from "@mui/material";
import { useMemo } from "react";

import DashboardToolbar from "../components/DashboardToolbar";
import DashboardFilterBar from "../components/DashboardFilterBar";
import DashboardGrid from "../components/DashboardGrid";
import MetricCardSkeleton from "../components/MetricCardSkeleton";
import { useDashboard } from "../hooks/useDashboard";
import { useDashboardLayout } from "../hooks/useDashboardLayout";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useMetricDrillDown } from "../hooks/useMetricDrillDown";

const DEFAULTS = Object.freeze([
  { id: "M001", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 10 },
  { id: "M002", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 20 },
  { id: "M004", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 30 },
  { id: "M006", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 40 },

  { id: "M007", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 50 },
  { id: "M009", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 60 },
  { id: "M011", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 70 },
  { id: "M043", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 80 },

  { id: "M003", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 100 },
  { id: "M005", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 110 },
  { id: "M014", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 120 },
  { id: "M008", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 130 },

  { id: "M017", w: 12, h: 6, minW: 6, minH: 5, visible: true, order: 140 },
  { id: "M023", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 150 },
  { id: "M024", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 160 },
  { id: "M025", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 170 },

  { id: "M029", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 180 },
  { id: "M030", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 190 },
  { id: "M032", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 200 },
  { id: "M033", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 210 },

  { id: "M037", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 220 },
  { id: "M038", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 230 },
  { id: "M040", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 240 },
  { id: "M041", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 250 },
  { id: "M042", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 260 },
]);

export default function ManagementDashboard() {
  const { filters, update } = useDashboardFilters();

  const { data, loading, refreshing, error, reload } = useDashboard(
    "management",
    filters,
  );

  const { layout, saving, reset } = useDashboardLayout(
    "management",
    DEFAULTS,
  );

  const onDrillDown = useMetricDrillDown();

  const visibleMetrics = useMemo(
    () => data?.metrics ?? [],
    [data],
  );

  return (
    <Stack spacing={2}>
      <DashboardToolbar
        title="Management Dashboard"
        generatedAt={data?.generatedAt}
        onRefresh={reload}
        onReset={reset}
        refreshing={refreshing}
        saving={saving}
      />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <DashboardFilterBar filters={filters} onChange={update} />
      </Paper>

      {error && (
        <Alert severity="error">
          Unable to load the management dashboard.
        </Alert>
      )}

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <DashboardGrid
          metrics={visibleMetrics}
          layout={layout}
          onDrillDown={onDrillDown}
        />
      )}
    </Stack>
  );
}
