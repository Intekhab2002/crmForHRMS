import service from "./dashboard.service.js";

function getPermissions(req) {
  return req.user?.permissions ?? req.auth?.permissions ?? [];
}

function getActorUserId(req) {
  return req.user?.id ?? req.auth?.userId ?? null;
}

export async function available(req, res, next) {
  try {
    const data = await service.getAvailableDashboards({
      permissions: getPermissions(req),
    });
    res.json({ success: true, statusCode: 200, message: "Dashboards retrieved successfully.", data });
  } catch (error) { next(error); }
}

export async function dashboard(req, res, next) {
  try {
    const data = await service.getDashboard({
      dashboardType: req.validatedParams.dashboardType,
      filters: req.validatedQuery,
      permissions: getPermissions(req),
      actorUserId: getActorUserId(req),
    });
    res.json({ success: true, statusCode: 200, message: "Dashboard retrieved successfully.", data });
  } catch (error) { next(error); }
}

export async function metric(req, res, next) {
  try {
    const data = await service.getMetric({
      dashboardType: req.validatedParams.dashboardType,
      metricCode: req.validatedParams.metricCode,
      filters: req.validatedQuery,
      permissions: getPermissions(req),
      actorUserId: getActorUserId(req),
    });
    res.json({ success: true, statusCode: 200, message: "Metric retrieved successfully.", data });
  } catch (error) { next(error); }
}

export async function layout(req, res, next) {
  try {
    const data = await service.getLayout({
      dashboardType: req.validatedParams.dashboardType,
      userId: getActorUserId(req),
      permissions: getPermissions(req),
    });
    res.json({ success: true, statusCode: 200, message: "Dashboard layout retrieved successfully.", data });
  } catch (error) { next(error); }
}

export async function updateLayout(req, res, next) {
  try {
    const data = await service.saveLayout({
      dashboardType: req.validatedParams.dashboardType,
      userId: getActorUserId(req),
      permissions: getPermissions(req),
      layout: req.validatedBody,
    });
    res.json({ success: true, statusCode: 200, message: "Dashboard layout saved successfully.", data });
  } catch (error) { next(error); }
}

export async function resetLayout(req, res, next) {
  try {
    const data = await service.resetLayout({
      dashboardType: req.validatedParams.dashboardType,
      userId: getActorUserId(req),
      permissions: getPermissions(req),
    });
    res.json({ success: true, statusCode: 200, message: "Dashboard layout reset successfully.", data });
  } catch (error) { next(error); }
}

export default Object.freeze({
  available,
  dashboard,
  metric,
  layout,
  updateLayout,
  resetLayout,
});
