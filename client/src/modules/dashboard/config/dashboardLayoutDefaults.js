export const DASHBOARD_LAYOUT_VERSION = 1;

const DASHBOARD_GRID_COLUMNS = 12;

function buildFallbackWidgets(defaults = []) {
  const widgets = [];

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const item of defaults) {
    const width = Math.min(
      Math.max(Number(item.w) || 1, Number(item.minW) || 1),
      DASHBOARD_GRID_COLUMNS,
    );

    const height = Math.max(
      Number(item.h) || 1,
      Number(item.minH) || 1,
    );

    if (
      cursorX > 0 &&
      cursorX + width > DASHBOARD_GRID_COLUMNS
    ) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    widgets.push({
      ...item,
      x: cursorX,
      y: cursorY,
      w: width,
      h: height,
    });

    cursorX += width;
    rowHeight = Math.max(rowHeight, height);

    if (cursorX >= DASHBOARD_GRID_COLUMNS) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }
  }

  return widgets;
}

export function normalizeLayout(layout, defaults = []) {
  const fallback = {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: buildFallbackWidgets(defaults),
  };

  if (
    !layout ||
    layout.version !== fallback.version ||
    !Array.isArray(layout.widgets)
  ) {
    return fallback;
  }

  const allowed = new Map(
    defaults.map((item) => [item.id, item]),
  );

  const normalizedWidgets = layout.widgets
    .filter((widget) => allowed.has(widget.id))
    .map((widget) => ({
      ...allowed.get(widget.id),
      ...widget,
    }));

  const seen = new Set(
    normalizedWidgets.map((widget) => widget.id),
  );

  for (const item of fallback.widgets) {
    if (!seen.has(item.id)) {
      normalizedWidgets.push(item);
    }
  }

  return {
    version: fallback.version,
    widgets: normalizedWidgets,
  };
}