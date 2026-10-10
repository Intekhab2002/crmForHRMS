import { useCallback, useMemo } from "react";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import DashboardWidget from "./DashboardWidget";
import { normalizeMetric } from "../config/metricRegistry";

const GRID_COLUMNS = 12;
const MEDIUM_BREAKPOINT = 900;
const MOBILE_BREAKPOINT = 600;

function getColumnCount(width) {
  if (width < MOBILE_BREAKPOINT) return 1;
  if (width < MEDIUM_BREAKPOINT) return 6;
  return GRID_COLUMNS;
}

function toGridItem(widget, columns, isCustomizing, mobileY) {
  if (columns === 1) {
    return {
      i: widget.id,
      x: 0,
      y: mobileY,
      w: 1,
      h: Math.max(2, Number(widget.h) || 2),
      minW: 1,
      minH: Math.max(1, Number(widget.minH) || 1),
      isDraggable: false,
      isResizable: false,
    };
  }

  const scale = columns / GRID_COLUMNS;
  const w = Math.min(
    columns,
    Math.max(1, Math.round((Number(widget.w) || 1) * scale)),
  );

  return {
    i: widget.id,
    x: Math.min(
      columns - w,
      Math.max(0, Math.round((Number(widget.x) || 0) * scale)),
    ),
    y: Math.max(0, Number(widget.y) || 0),
    w,
    h: Math.max(1, Number(widget.h) || 1),
    minW: Math.min(
      w,
      Math.max(1, Math.round((Number(widget.minW) || 1) * scale)),
    ),
    minH: Math.max(1, Number(widget.minH) || 1),
    isDraggable: isCustomizing,
    isResizable: isCustomizing,
  };
}

function fromGridLayout(gridLayout, currentLayout, columns) {
  const positions = new Map(
    gridLayout.map((item) => [
      item.i,
      {
        x: columns === 1
          ? 0
          : Math.min(
              11,
              Math.round((item.x * GRID_COLUMNS) / columns),
            ),
        y: item.y,
        w: columns === 1
          ? 12
          : Math.min(
              GRID_COLUMNS,
              Math.max(1, Math.round((item.w * GRID_COLUMNS) / columns)),
            ),
        h: item.h,
      },
    ]),
  );

  const orderedIds = [...gridLayout]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((item) => item.i);
  const orderById = new Map(
    orderedIds.map((id, index) => [id, (index + 1) * 10]),
  );

  return {
    version: currentLayout.version,
    widgets: currentLayout.widgets.map((widget) => {
      const position = positions.get(widget.id);
      if (!position || widget.visible === false) return widget;

      return {
        ...widget,
        ...position,
        order: orderById.get(widget.id) ?? widget.order,
      };
    }),
  };
}

export default function DashboardLayoutGrid({
  metrics = [],
  layout,
  onLayoutChange,
  onDrillDown,
  isCustomizing = false,
}) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200,
  });

  const columns = getColumnCount(width);

  const metricMap = useMemo(
    () => new Map(
      metrics.map((metric) => {
        const normalized = normalizeMetric(metric);
        return [normalized.id, normalized];
      }),
    ),
    [metrics],
  );

  const visibleWidgets = useMemo(
    () => (layout?.widgets ?? [])
      .filter((widget) => widget.visible !== false)
      .filter((widget) => metricMap.has(widget.id)),
    [layout?.widgets, metricMap],
  );

  const gridLayout = useMemo(() => {
    let mobileY = 0;
    return visibleWidgets.map((widget) => {
      const item = toGridItem(widget, columns, isCustomizing, mobileY);
      if (columns === 1) mobileY += item.h;
      return item;
    });
  }, [visibleWidgets, columns, isCustomizing]);

  const handleLayoutChange = useCallback((nextGridLayout) => {
    if (
      !isCustomizing ||
      columns === 1 ||
      typeof onLayoutChange !== "function"
    ) {
      return;
    }

    onLayoutChange(fromGridLayout(nextGridLayout, layout, columns));
  }, [columns, isCustomizing, layout, onLayoutChange]);

  if (!visibleWidgets.length) {
    return (
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={1}>
          <Typography color="text.secondary">
            No visible widgets are configured for this dashboard.
          </Typography>
          {isCustomizing && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Use “Manage widgets” to restore hidden widgets.
            </Typography>
          )}
        </Stack>
      </Paper>
    );
  }

  return (
    <Box ref={containerRef} sx={{ width: "100%", minWidth: 0 }}>
      {isCustomizing && columns === 1 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Cards are stacked on narrow screens. Dragging and resizing are available on wider screens.
        </Alert>
      )}

      {mounted && (
        <ReactGridLayout
          width={width}
          layout={gridLayout}
          gridConfig={{
            cols: columns,
            rowHeight: 42,
            margin: [16, 16],
            padding: [0, 0],
          }}
          dragConfig={{
            enabled: isCustomizing && columns > 1,
            handle: ".dashboard-widget-drag-handle",
            cancel: "button, a, input, textarea, select, .dashboard-widget-no-drag",
            bounded: true,
          }}
          resizeConfig={{
            enabled: isCustomizing && columns > 1,
            handles: ["se", "sw"],
          }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
          autoSize
          style={{ minHeight: 1 }}
        >
          {visibleWidgets.map((widget) => {
            const metric = metricMap.get(widget.id);
            if (!metric) return null;

            return (
              <Box
                key={widget.id}
                sx={{
                  height: "100%",
                  minWidth: 0,
                  overflow: "visible",
                  outline: isCustomizing ? "1px dashed" : "none",
                  outlineColor: isCustomizing ? "divider" : "transparent",
                  borderRadius: 2,
                  bgcolor: isCustomizing ? "action.hover" : "transparent",
                  p: isCustomizing ? 0.75 : 0,
                }}
              >
                {isCustomizing && (
                  <Box
                    className="dashboard-widget-drag-handle"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      height: 26,
                      mb: 0.5,
                      px: 0.5,
                      color: "text.secondary",
                      cursor: "grab",
                      userSelect: "none",
                      "&:active": { cursor: "grabbing" },
                    }}
                    aria-label={`Drag to move ${metric.label ?? widget.id}`}
                    title="Drag to move this card"
                  >
                    <DragIndicatorRoundedIcon fontSize="small" />
                    <Typography variant="caption" fontWeight={700}>
                      Drag to move
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    height: isCustomizing ? "calc(100% - 30px)" : "100%",
                    minWidth: 0,
                  }}
                >
                  <DashboardWidget
                    metric={metric}
                    onDrillDown={onDrillDown}
                    size={{ xs: 12 }}
                  />
                </Box>
              </Box>
            );
          })}
        </ReactGridLayout>
      )}
    </Box>
  );
}
