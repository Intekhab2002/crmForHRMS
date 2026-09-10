import { APP_MODULE_CONFIG } from "./module.config";

function resolvePath(parentPath, route) {
  if (route.index) {
    return parentPath || "/";
  }

  if (!route.path) {
    return parentPath;
  }

  if (route.path.startsWith("/") || route.path === "*") {
    return route.path;
  }

  const normalizedParent = parentPath.endsWith("/")
    ? parentPath.slice(0, -1)
    : parentPath;

  return `${normalizedParent}/${route.path}`;
}

function collectNavigation(routes, section, parentPath = "") {
  return routes.flatMap((route) => {
    const path = resolvePath(parentPath, route);

    /*
     * A route can contain nested navigation items without every route
     * in the tree declaring its own navigation section.
     *
     * Only routes explicitly marked for this navigation section become
     * navigation nodes, but their navigation-enabled descendants remain
     * attached to them.
     */
    if (route.navigation?.section !== section) {
      return [];
    }

    const children = collectChildNavigation(
      route.children ?? [],
      section,
      path,
    );

    return [
      {
        id: route.id,
        label: route.label,
        path,
        permissions: route.access?.permissions ?? [],
        iconKey: route.navigation?.iconKey,
        order: route.navigation?.order ?? 0,
        children,
      },
    ];
  });
}

function collectChildNavigation(routes, section, parentPath) {
  return routes.flatMap((route) => {
    const path = resolvePath(parentPath, route);

    /*
     * A child is a navigation item only when it explicitly declares
     * navigation metadata for the requested section.
     */
    if (route.navigation?.section !== section) {
      return [];
    }

    return [
      {
        id: route.id,
        label: route.label,
        path,
        permissions: route.access?.permissions ?? [],
        iconKey: route.navigation?.iconKey,
        order: route.navigation?.order ?? 0,
        children: collectChildNavigation(route.children ?? [], section, path),
      },
    ];
  });
}

function sortNavigation(items) {
  return [...items]
    .sort((first, second) => first.order - second.order)
    .map((item) => ({
      ...item,
      children: sortNavigation(item.children ?? []),
    }));
}

const routesConfig = [
  ...APP_MODULE_CONFIG.public.routes,
  ...APP_MODULE_CONFIG.dashboard.routes,
];

export const NAVIGATION_CONFIG = Object.freeze({
  public: Object.freeze(
    sortNavigation(collectNavigation(routesConfig, "public")),
  ),

  app: Object.freeze(sortNavigation(collectNavigation(routesConfig, "app"))),
});

export default NAVIGATION_CONFIG;
