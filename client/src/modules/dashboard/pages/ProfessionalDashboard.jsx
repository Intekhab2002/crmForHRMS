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
  { id: "P001", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 10 },
  { id: "P002", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 20 },
  { id: "P003", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 30 },
  { id: "P004", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 40 },
  { id: "P005", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 50 },
  { id: "P006", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 60 },
  { id: "P007", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 70 },
  { id: "P008", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 80 },
  { id: "P009", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 90 },
  { id: "P010", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 100 },
  { id: "P011", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 110 },
  { id: "P012", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 120 },
]);

export default function ProfessionalDashboard() {
  const { filters, update } = useDashboardFilters();

  const { data, loading, refreshing, error, reload } = useDashboard(
    "professional",
    filters,
  );

  const { layout, saving, reset } = useDashboardLayout(
    "professional",
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
        title="Professional Dashboard"
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
          Unable to load the professional dashboard.
        </Alert>
      )}

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {DEFAULTS.map((widget) => (
            <MetricCardSkeleton key={widget.id} />
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
