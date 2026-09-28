export const DASHBOARD_LAYOUT_VERSION = 1;

export function normalizeLayout(layout, defaults = []) {
  const fallback = {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: defaults.map((item, index) => ({
      x: (index % 4) * 3,
      y: Math.floor(index / 4) * 2,
      ...item,
    })),
  };

  if (!layout || layout.version !== fallback.version || !Array.isArray(layout.widgets)) {
    return fallback;
  }

  const allowed = new Map(defaults.map((item) => [item.id, item]));
  const widgets = layout.widgets
    .filter((widget) => allowed.has(widget.id))
    .map((widget) => ({ ...allowed.get(widget.id), ...widget }));

  const seen = new Set(widgets.map((widget) => widget.id));
  for (const item of fallback.widgets) {
    if (!seen.has(item.id)) widgets.push(item);
  }

  return {
    version: fallback.version,
    widgets,
  };
}
