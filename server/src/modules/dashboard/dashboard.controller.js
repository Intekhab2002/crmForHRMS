import rbacService from "../rbac/rbac.service.js";
import service from "./dashboard.service.js";

function getActorUserId(req) {
  return req.auth?.userId ?? null;
}

/**
 * Resolve the authenticated user's permission codes through
 * the existing centralized RBAC architecture.
 *
 * Permissions are intentionally NOT read from req.auth because
 * authentication middleware only establishes identity.
 */
async function getPermissions(req) {
  const userId = getActorUserId(req);

  if (!userId) {
    return [];
  }

  const authorizationContext =
    await rbacService.getAuthorizationContext(userId);

  return authorizationContext.permissions.map(
    (permission) => permission.code,
  );
}

export async function available(req, res, next) {
  try {
    const permissions =
      await getPermissions(req);

    const data =
      await service.getAvailableDashboards({
        permissions,
      });

    res.json({
      success: true,
      statusCode: 200,
      message:
        "Dashboards retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function dashboard(req, res, next) {
  try {
    const permissions =
      await getPermissions(req);

    const data =
      await service.getDashboard({
        dashboardType:
          req.validatedParams.dashboardType,

        filters:
          req.validatedQuery,

        permissions,

        actorUserId:
          getActorUserId(req),
      });

    res.json({
      success: true,
      statusCode: 200,
      message:
        "Dashboard retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function metric(req, res, next) {
  try {
    const permissions =
      await getPermissions(req);

    const data =
      await service.getMetric({
        dashboardType:
          req.validatedParams.dashboardType,

        metricCode:
          req.validatedParams.metricCode,

        filters:
          req.validatedQuery,

        permissions,

        actorUserId:
          getActorUserId(req),
      });

    res.json({
      success: true,
      statusCode: 200,
      message:
        "Metric retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function layout(req, res, next) {
  try {
    const permissions =
      await getPermissions(req);

    const data =
      await service.getLayout({
        dashboardType:
          req.validatedParams.dashboardType,

        userId:
          getActorUserId(req),

        permissions,
      });

    res.json({
      success: true,
      statusCode: 200,
      message:
        "Dashboard layout retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLayout(req, res, next) {
  try {
    const permissions =
      await getPermissions(req);

    const data =
      await service.saveLayout({
        dashboardType:
          req.validatedParams.dashboardType,

        userId:
          getActorUserId(req),

        permissions,

        layout:
          req.validatedBody,
      });

    res.json({
      success: true,
      statusCode: 200,
      message:
        "Dashboard layout saved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetLayout(req, res, next) {
  try {
    const permissions =
      await getPermissions(req);

    const data =
      await service.resetLayout({
        dashboardType:
          req.validatedParams.dashboardType,

        userId:
          getActorUserId(req),

        permissions,
      });

    res.json({
      success: true,
      statusCode: 200,
      message:
        "Dashboard layout reset successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export default Object.freeze({
  available,
  dashboard,
  metric,
  layout,
  updateLayout,
  resetLayout,
});