import { useMemo } from "react";
import { APP_MODULE_CONFIG } from "../config/module.config";
import { canAccessRoles } from "../config/access.config";
import { APP_CONFIG } from "../config/app.config";
import { DASHBOARD_CONFIG } from "../config/dashboard.config";
import { TICKET_FIELD_CONFIG } from "../config/field.config";
import { TICKET_MODULE_CONFIG } from "../config/ticket.config";
import { AppConfigContext } from "./AppConfigContextValue";

function resolveNavigation(routes, section, parentPath = "") {
  return routes.flatMap((route) => {
    const path = route.path?.startsWith("/")
      ? route.path
      : `${parentPath}/${route.path ?? ""}`.replace(/\/+/g, "/");

    const own = route.navigation?.section === section
      ? [{
          id: route.id,
          label: route.label,
          path,
          icon: route.navigation.icon,
          order: route.navigation.order ?? 0,
          accessible: (roles) => canAccessRoles(roles, route.access?.roles),
        }]
      : [];

    const children = route.children ? resolveNavigation(route.children, section, path) : [];
    return [...own, ...children];
  });
}

export function AppConfigProvider({ children }) {
  const value = useMemo(() => ({
    app: APP_CONFIG,
    modules: APP_MODULE_CONFIG,
    routes: APP_MODULE_CONFIG,
    dashboard: DASHBOARD_CONFIG,
    ticket: TICKET_MODULE_CONFIG,
    ticketFields: TICKET_FIELD_CONFIG,
    navigation: {
      app: resolveNavigation(APP_MODULE_CONFIG.dashboard.routes, "app")
        .sort((a, b) => a.order - b.order),
      public: resolveNavigation(APP_MODULE_CONFIG.public.routes, "public")
        .sort((a, b) => a.order - b.order),
    },
  }), []);

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}
