import { Alert, Paper, Stack } from "@mui/material";
import { useMemo } from "react";
import DashboardToolbar from "../components/DashboardToolbar";
import DashboardFilterBar from "../components/DashboardFilterBar";
import DashboardGrid from "../components/DashboardGrid";
import DashboardCustomizeMenu from "../components/DashboardCustomizeMenu";
import MetricCardSkeleton from "../components/MetricCardSkeleton";
import { useDashboard } from "../hooks/useDashboard";
import { useDashboardLayout } from "../hooks/useDashboardLayout";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useMetricDrillDown } from "../hooks/useMetricDrillDown";

const DEFAULTS = [
  { id: "tickets.total", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 10 },
  { id: "tickets.open", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 20 },
  { id: "tickets.in_progress", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 30 },
  { id: "tickets.waiting", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 40 },
  { id: "tickets.closed", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 50 },
  { id: "tickets.unassigned", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 60 },
  { id: "sla.running", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 70 },
  { id: "sla.breached", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 80 },
  { id: "sla.compliance", w: 3, h: 2, minW: 2, minH: 2, visible: true, order: 90 },
  { id: "tickets.status_distribution", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 100 },
  { id: "tickets.priority_workload", w: 6, h: 5, minW: 4, minH: 4, visible: true, order: 110 },
  { id: "tickets.created_closed_trend", w: 12, h: 5, minW: 6, minH: 4, visible: true, order: 120 },
  { id: "tickets.my_tickets", w: 12, h: 6, minW: 6, minH: 4, visible: true, order: 130 },
];

export default function OperationalDashboard() {
  const { filters, update } = useDashboardFilters();
  const { data, loading, refreshing, error, reload } = useDashboard("operational", filters);
  const { layout, saving, reset } = useDashboardLayout("operational", DEFAULTS);
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
      />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <DashboardFilterBar filters={filters} onChange={update} />
      </Paper>

      {error && <Alert severity="error">Unable to load the operational dashboard.</Alert>}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, index) => <MetricCardSkeleton key={index} />)}
        </div>
      ) : (
        <DashboardGrid metrics={visibleMetrics} layout={layout} onDrillDown={onDrillDown} />
      )}
    </Stack>
  );
}
