import { useMemo } from "react";

import { APP_MODULE_CONFIG } from "../config/module.config";
import { APP_CONFIG } from "../config/app.config";
import { DASHBOARD_CONFIG } from "../config/dashboard.config";
import { TICKET_FIELD_CONFIG, TICKET_MODULE_CONFIG } from "../config/ticket.config";

import { AppConfigContext } from "./AppConfigContextValue";

function resolvePath(parentPath, route) {
  if (route.index) {
    return parentPath || "/";
  }

  if (!route.path) {
    return parentPath || "/";
  }

  if (route.path.startsWith("/")) {
    return route.path;
  }

  return `${parentPath}/${route.path}`.replace(/\/+/g, "/");
}

function resolveNavigation(routes, section, parentPath = "") {
  return routes.flatMap((route) => {
    const path = resolvePath(parentPath, route);

    const ownNavigation =
      route.navigation?.section === section
        ? [
            {
              id: route.id,
              label: route.label,
              path,
              icon: route.navigation.icon,
              iconKey: route.navigation.iconKey,
              order: route.navigation.order ?? 0,
              permissions: route.access?.permissions ?? [],
            },
          ]
        : [];

    const children = route.children
      ? resolveNavigation(route.children, section, path)
      : [];

    return [...ownNavigation, ...children];
  });
}

export function AppConfigProvider({ children }) {
  const value = useMemo(() => {
    const appNavigation = resolveNavigation(
      APP_MODULE_CONFIG.dashboard.routes,
      "app",
    ).sort((first, second) => first.order - second.order);

    const publicNavigation = resolveNavigation(
      APP_MODULE_CONFIG.public.routes,
      "public",
    ).sort((first, second) => first.order - second.order);

    return {
      app: APP_CONFIG,
      modules: APP_MODULE_CONFIG,
      routes: APP_MODULE_CONFIG,
      dashboard: DASHBOARD_CONFIG,
      ticket: TICKET_MODULE_CONFIG,
      ticketFields: TICKET_FIELD_CONFIG,

      navigation: {
        app: Object.freeze(appNavigation),
        public: Object.freeze(publicNavigation),
      },
    };
  }, []);

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}