import DashboardLayoutGrid from "./DashboardLayoutGrid";

export default function DashboardGrid({
  metrics,
  layout,
  onLayoutChange,
  onDrillDown,
  isCustomizing = false,
}) {
  return (
    <DashboardLayoutGrid
      metrics={metrics}
      layout={layout}
      onLayoutChange={onLayoutChange}
      onDrillDown={onDrillDown}
      isCustomizing={isCustomizing}
    />
  );
}
