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

const DEFAULTS = [
  // Main KPI cards remain configurable here when enabled.
  // { id: "tickets.total", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 10 },
  // { id: "tickets.open", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 20 },
  // { id: "tickets.in_progress", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 30 },
  // { id: "tickets.waiting", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 40 },
  // { id: "tickets.closed", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 50 },
  // { id: "tickets.unassigned", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 60 },
  // { id: "sla.running", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 70 },
  // { id: "sla.breached", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 80 },
  // { id: "sla.compliance", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 90 },

  { id: "tickets.my_created", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 91 },
  { id: "tickets.my_assigned", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 92 },
  { id: "tickets.my_open", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 93 },
  { id: "tickets.my_in_progress", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 94 },
  { id: "tickets.my_waiting", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 95 },
  { id: "tickets.my_closed", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 96 },

  { id: "tickets.status_distribution", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 100 },
  { id: "sla.status_distribution", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 110 },
  { id: "tickets.severity_distribution", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 120 },
  { id: "tickets.created_closed_trend", w: 12, h: 5, minW: 6, minH: 4, visible: true, order: 130 },
];

export default function OperationalDashboard() {
  const { filters, update } = useDashboardFilters();
  const { data, loading, refreshing, error, reload } = useDashboard(
    "operational",
    filters,
  );

  const {
    layout,
    saving,
    saveError,
    isCustomizing,
    setLayout,
    toggleWidgetVisibility,
    startCustomization,
    finishCustomization,
    reset,
  } = useDashboardLayout("operational", DEFAULTS);

  const onDrillDown = useMetricDrillDown();
  const visibleMetrics = useMemo(() => data?.metrics ?? [], [data]);

  return (
    <Stack spacing={2}>
      <DashboardToolbar
        title="Operational Dashboard"
        generatedAt={data?.generatedAt}
        onRefresh={reload}
        onReset={reset}
        refreshing={refreshing}
        saving={saving}
        isCustomizing={isCustomizing}
        onStartCustomization={startCustomization}
        onFinishCustomization={finishCustomization}
        widgets={layout.widgets}
        onToggleWidget={toggleWidgetVisibility}
        saveError={saveError}
      />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <DashboardFilterBar filters={filters} onChange={update} />
      </Paper>

      {error && (
        <Alert severity="error">
          Unable to load the operational dashboard.
        </Alert>
      )}

      {loading ? (
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          {Array.from({ length: 8 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </Stack>
      ) : (
        <DashboardGrid
          metrics={visibleMetrics}
          layout={layout}
          onLayoutChange={setLayout}
          isCustomizing={isCustomizing}
          onDrillDown={onDrillDown}
        />
      )}
    </Stack>
  );
}
