import AppError from "../../helpers/AppError.js";
import logger from "../../config/logger.js";
import { DASHBOARD_CONFIG } from "./dashboard.config.js";
import {
  DASHBOARD_TYPES,
  DASHBOARD_LAYOUT_VERSION,
} from "./dashboard.constants.js";
import metrics from "./dashboard.metrics.js";
import layoutRepository from "./dashboard.layout.repository.js";
import { layoutSchema } from "./dashboard.validator.js";

function assertDashboardType(dashboardType) {
  if (!DASHBOARD_TYPES.includes(dashboardType)) {
    throw AppError.notFound(`Dashboard '${dashboardType}' was not found.`);
  }
  return DASHBOARD_CONFIG[dashboardType];
}

function normalizeFilters(input = {}) {
  return Object.freeze({
    periodStart: input.periodStart || null,
    periodEnd: input.periodEnd || null,
    departmentId: input.departmentId || [],
    organizationId: input.organizationId || [],
    assignedUserId: input.assignedUserId || [],
    priority: input.priority || [],
    severity: input.severity || [],
    category: input.category || [],
    status: input.status || [],
    slaPolicyId: input.slaPolicyId || [],
    slaStatus: input.slaStatus || [],
  });
}

const DASHBOARD_GRID_COLUMNS = 12;

function defaultLayout(config) {
  const widgets = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const widget of config.defaultWidgets) {
    const width = Math.min(
      Math.max(Number(widget.w) || 1, Number(widget.minW) || 1),
      DASHBOARD_GRID_COLUMNS,
    );

    const height = Math.max(Number(widget.h) || 1, Number(widget.minH) || 1);

    if (cursorX > 0 && cursorX + width > DASHBOARD_GRID_COLUMNS) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    widgets.push({
      ...widget,
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

  return {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets,
  };
}

function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function isValidLayoutGeometry(widgets) {
  const seen = new Set();

  for (const widget of widgets) {
    if (seen.has(widget.id)) return false;
    seen.add(widget.id);

    if (
      !Number.isInteger(widget.x) ||
      !Number.isInteger(widget.y) ||
      !Number.isInteger(widget.w) ||
      !Number.isInteger(widget.h) ||
      widget.x < 0 ||
      widget.y < 0 ||
      widget.w < 1 ||
      widget.w > 12 ||
      widget.h < 1 ||
      widget.h > 100 ||
      widget.x + widget.w > 12 ||
      (widget.minW !== undefined && widget.minW > widget.w) ||
      (widget.minH !== undefined && widget.minH > widget.h)
    ) {
      return false;
    }
  }

  const visible = widgets.filter((widget) => widget.visible !== false);
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      if (rectanglesOverlap(visible[i], visible[j])) return false;
    }
  }

  return true;
}

function validateSavedLayout(saved, config) {
  if (!saved?.layout_json) return null;

  let parsed;
  try {
    parsed = typeof saved.layout_json === "string"
      ? JSON.parse(saved.layout_json)
      : saved.layout_json;
  } catch {
    return null;
  }

  if (
    !parsed ||
    parsed.version !== config.layoutVersion ||
    !Array.isArray(parsed.widgets)
  ) {
    return null;
  }

  const defaults = defaultLayout(config).widgets;
  const defaultsById = new Map(
    defaults.map((widget) => [widget.id, widget]),
  );

  const savedWidgets = [];
  const seen = new Set();

  for (const widget of parsed.widgets) {
    if (
      !widget ||
      typeof widget.id !== "string" ||
      !defaultsById.has(widget.id) ||
      seen.has(widget.id)
    ) {
      return null;
    }

    seen.add(widget.id);
    savedWidgets.push({
      ...defaultsById.get(widget.id),
      ...widget,
    });
  }

  if (!isValidLayoutGeometry(savedWidgets)) return null;

  for (const defaultWidget of defaults) {
    if (!seen.has(defaultWidget.id)) {
      savedWidgets.push(defaultWidget);
    }
  }

  // Existing saved widget positions were validated. New defaults are laid out
  // by defaultLayout(config), so they retain a valid configured position.
  return {
    version: config.layoutVersion,
    widgets: savedWidgets,
  };
}

async function buildMetricContext({ filters, actorUserId, tx }) {
  return {
    filters,
    actorUserId,
    tx,
  };
}

export async function getAvailableDashboards({ permissions = [] }) {
  return Object.values(DASHBOARD_CONFIG)
    .filter((dashboard) => permissions.includes(dashboard.permission))
    .map((dashboard) => ({
      code: dashboard.code,
      name: dashboard.name,
      permission: dashboard.permission,
    }));
}

export async function getDashboard({
  dashboardType,
  filters: inputFilters,
  permissions,
  actorUserId,
  tx = null,
}) {
  const config = assertDashboardType(dashboardType);

  if (!permissions.includes(config.permission)) {
    throw AppError.forbidden("You do not have access to this dashboard.");
  }

  const filters = normalizeFilters(inputFilters);
  const definitions = metrics
    .getMetricsForDashboard(dashboardType)
    .filter((definition) => permissions.includes(definition.permission));

  const metricContext = await buildMetricContext({
    filters,
    actorUserId,
    tx,
  });

  const startedAt = Date.now();

  const results = await Promise.all(
    definitions.map(async (definition) => {
      const metricStarted = Date.now();

      try {
        const data = await metrics.executeMetric(
          definition.code,
          metricContext,
        );
        logger.info("dashboard_metric_executed", {
          dashboardType,
          metricCode: definition.code,
          durationMs: Date.now() - metricStarted,
          actorUserId,
        });
        return data;
      } catch (error) {
        logger.error("dashboard_metric_failed", {
          dashboardType,
          metricCode: definition.code,
          durationMs: Date.now() - metricStarted,
          actorUserId,
          error: error.message,
          stack: error.stack,
        });

        return {
          code: definition.code,
          label: definition.name,
          description: definition.description ?? null,
          value: null,
          unit: null,
          trend: null,
          visualization: definition.visualization,
          data: null,
          drillDown: null,
          metadata: {
            error: {
              code: "METRIC_QUERY_FAILED",
              message: "Metric data is temporarily unavailable.",
            },
            definition: {
              code: definition.code,
              description: definition.description ?? null,
              filters: definition.filters ?? [],
              timePeriod: definition.timePeriod ?? null,
              visualization: definition.visualization,
              calculation: definition.calculation ?? null,
              interpretation: definition.interpretation ?? null,
              dataSource: definition.dataSource ?? null,
              idealValue: definition.idealValue ?? null,
              target: definition.target ?? null,
              belowTarget: definition.belowTarget ?? null,
              aboveTarget: definition.aboveTarget ?? null,
            },
          },
        };
      }
    }),
  );

  logger.info("dashboard_requested", {
    dashboardType,
    actorUserId,
    durationMs: Date.now() - startedAt,
  });

  return {
    dashboard: {
      code: config.code,
      name: config.name,
      permissions: [config.permission],
    },
    filters,
    generatedAt: new Date().toISOString(),
    metrics: results.filter(Boolean),
    layout: defaultLayout(config),
  };
}

export async function getMetric({
  dashboardType,
  metricCode,
  filters: inputFilters,
  permissions,
  actorUserId,
  tx = null,
}) {
  const config = assertDashboardType(dashboardType);

  if (!permissions.includes(config.permission)) {
    throw AppError.forbidden("You do not have access to this dashboard.");
  }

  const definition = metrics.getMetric(metricCode);

  if (!definition || !definition.dashboardTypes.includes(dashboardType)) {
    throw AppError.notFound(
      `Metric '${metricCode}' was not found for this dashboard.`,
    );
  }

  if (!permissions.includes(definition.permission)) {
    throw AppError.forbidden("You do not have access to this metric.");
  }

  const filters = normalizeFilters(inputFilters);
  const data = await metrics.executeMetric(metricCode, {
    filters,
    actorUserId,
    tx,
  });

  return {
    dashboard: {
      code: config.code,
      name: config.name,
      permissions: [config.permission],
    },
    filters,
    generatedAt: new Date().toISOString(),
    metric: data,
  };
}

export async function getLayout({
  dashboardType,
  userId,
  permissions,
  tx = null,
}) {
  const config = assertDashboardType(dashboardType);

  if (!permissions.includes(config.permission)) {
    throw AppError.forbidden("You do not have access to this dashboard.");
  }

  const saved = await layoutRepository.findByUserAndType(
    userId,
    dashboardType,
    tx,
  );
  const layout = validateSavedLayout(saved, config) || defaultLayout(config);

  return {
    version: config.layoutVersion,
    dashboardType,
    source: saved ? "user" : "default",
    layout,
  };
}

export async function saveLayout({
  dashboardType,
  userId,
  permissions,
  layout,
  tx = null,
}) {
  const config = assertDashboardType(dashboardType);

  if (!permissions.includes(config.permission)) {
    throw AppError.forbidden("You do not have access to this dashboard.");
  }

  const parsed = layoutSchema.safeParse(layout);
  if (!parsed.success) {
    throw AppError.badRequest("The dashboard layout is invalid.", {
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      code: "INVALID_DASHBOARD_LAYOUT",
    });
  }

  if (parsed.data.version !== config.layoutVersion) {
    throw AppError.badRequest("The dashboard layout version is not supported.", {
      code: "INVALID_DASHBOARD_LAYOUT_VERSION",
    });
  }

  const allowedIds = new Set(config.defaultWidgets.map((widget) => widget.id));
  for (const widget of parsed.data.widgets) {
    if (!allowedIds.has(widget.id)) {
      throw AppError.badRequest(
        `Widget '${widget.id}' is not configured for this dashboard.`,
        { code: "UNKNOWN_DASHBOARD_WIDGET" },
      );
    }
  }

  if (!isValidLayoutGeometry(parsed.data.widgets)) {
    throw AppError.badRequest(
      "The dashboard layout contains invalid dimensions or overlapping visible widgets.",
      { code: "INVALID_DASHBOARD_LAYOUT_GEOMETRY" },
    );
  }

  const normalized = {
    version: config.layoutVersion,
    widgets: parsed.data.widgets.map((widget) => ({ ...widget })),
  };

  const saved = await layoutRepository.upsert(
    {
      userId,
      dashboardType,
      layoutVersion: config.layoutVersion,
      layoutJson: normalized,
    },
    tx,
  );

  return {
    version: config.layoutVersion,
    dashboardType,
    source: "user",
    layout: {
      version: saved.layout_version,
      widgets: saved.layout_json.widgets ?? saved.layout_json,
    },
  };
}


export async function resetLayout({
  dashboardType,
  userId,
  permissions,
  tx = null,
}) {
  const config = assertDashboardType(dashboardType);

  if (!permissions.includes(config.permission)) {
    throw AppError.forbidden("You do not have access to this dashboard.");
  }

  await layoutRepository.remove(userId, dashboardType, tx);

  return {
    version: config.layoutVersion,
    dashboardType,
    source: "default",
    layout: defaultLayout(config),
  };
}

export default Object.freeze({
  getAvailableDashboards,
  getDashboard,
  getMetric,
  getLayout,
  saveLayout,
  resetLayout,
});
