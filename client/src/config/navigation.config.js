
function resolvePath(parentPath, route) {
  if (route.index) return parentPath || "/";
  if (!route.path) return parentPath;
  if (route.path.startsWith("/") || route.path === "*") return route.path;

  const normalizedParent = parentPath.endsWith("/")
    ? parentPath.slice(0, -1)
    : parentPath;

  return `${normalizedParent}/${route.path}`;
}

function collectNavigation(routes, section, parentPath = "") {
  return routes.flatMap((route) => {
    const path = resolvePath(parentPath, route);
    const children = route.children
      ? collectNavigation(route.children, section, path)
      : [];

    if (route.navigation?.section !== section) {
      return children;
    }

    return [
      {
        id: route.id,
        label: route.label,
        path,
        permissions: route.access?.permissions ?? [],
        iconKey: route.navigation.iconKey,
        order: route.navigation.order ?? 0,
      },
      ...children,
    ];
  });
}

function sortNavigation(items) {
  return [...items].sort((first, second) => first.order - second.order);
}

export const NAVIGATION_CONFIG = Object.freeze({
  public: Object.freeze(
    sortNavigation(collectNavigation(ROUTES_CONFIG, "public")),
  ),
  app: Object.freeze(sortNavigation(collectNavigation(ROUTES_CONFIG, "app"))),
});
