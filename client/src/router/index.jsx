import {
  Outlet,
  createBrowserRouter,
} from "react-router";

import PublicLayout from "../layouts/PublicLayout/PublicLayout";
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import PermissionRoute from "./PermissionRoute";

import HomePage from "../pages/public/HomePage";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";
import DashboardPage from "../pages/dashboard/DashboardPage";

import PublicTicketStatusPage from "../modules/tickets/pages/PublicTicketStatusPage";
import TicketsListPage from "../modules/tickets/pages/TicketsListPage";
import TicketCreatePage from "../modules/tickets/pages/TicketCreatePage";
import TicketLifecyclePage from "../modules/tickets/pages/TicketLifecyclePage";

import UserManagementPage from "../modules/users/pages/UserManagementPage";
import LoginPage from "../modules/auth/pages/LoginPage";

import ForbiddenPage from "../pages/common/ForbiddenPage";
import NotFoundPage from "../pages/common/NotFoundPage";
import DefaultEntryPage from "../pages/common/DefaultEntryPage";

import {
  APP_MODULE_CONFIG,
  SYSTEM_ROUTES,
} from "../config/module.config";

const LAYOUTS = Object.freeze({
  public: PublicLayout,
  auth: AuthLayout,
  dashboard: DashboardLayout,
});

const GUARDS = Object.freeze({
  auth: ProtectedRoute,
  guest: PublicRoute,
});

const COMPONENTS = Object.freeze({
  home: HomePage,
  about: AboutPage,
  contact: ContactPage,
  login: LoginPage,
  dashboard: DashboardPage,
  users: UserManagementPage,
  publicTicketStatus: PublicTicketStatusPage,
  ticketsList: TicketsListPage,
  ticketCreate: TicketCreatePage,
  ticketLifecycle: TicketLifecyclePage,
  forbidden: ForbiddenPage,
  notFound: NotFoundPage,
  defaultEntry: DefaultEntryPage,
});

function applyPermissionGuard(route, element) {
  const permissions = route.access?.permissions ?? [];

  if (!permissions.length) {
    return element;
  }

  return (
    <PermissionRoute allPermissions={permissions}>
      {element}
    </PermissionRoute>
  );
}

function buildRoute(route) {
  const Guard = route.guard
    ? GUARDS[route.guard]
    : null;

  const Layout = route.layout
    ? LAYOUTS[route.layout]
    : null;

  const Component = route.component
    ? COMPONENTS[route.component]
    : null;

  /*
   * Layout routes own the Outlet.
   * Component routes render their component.
   */
  let element = Layout ? (
    <Layout />
  ) : Component ? (
    <Component />
  ) : (
    <Outlet />
  );

  /*
   * Permission protection must wrap the actual route
   * element so navigation, direct URL access and route
   * rendering use the same authorization definition.
   */
  element = applyPermissionGuard(route, element);

  /*
   * Guard is applied outside permission protection.
   * This allows:
   *
   * ProtectedRoute
   *     ↓
   * PermissionRoute
   *     ↓
   * Page/Layout
   */
  if (Guard) {
    element = (
      <Guard>
        {element}
      </Guard>
    );
  }

  const result = {
    element,
  };

  if (route.path) {
    result.path = route.path;
  }

  if (route.index) {
    result.index = true;
  }

  if (route.children?.length) {
    result.children = route.children.map(buildRoute);
  }

  return result;
}

const publicRoutes = {
  layout: APP_MODULE_CONFIG.public.layout,
  children: APP_MODULE_CONFIG.public.routes,
};

const authRoutes = {
  guard: "guest",
  children: [
    {
      layout: APP_MODULE_CONFIG.auth.layout,
      children: APP_MODULE_CONFIG.auth.routes,
    },
  ],
};

const dashboardRoutes = {
  guard: "auth",
  children: [
    {
      layout: APP_MODULE_CONFIG.dashboard.layout,
      children: APP_MODULE_CONFIG.dashboard.routes,
    },
  ],
};

export const router = createBrowserRouter([
  {
    path: SYSTEM_ROUTES.defaultEntry,
    element: <DefaultEntryPage />,
  },

  buildRoute(publicRoutes),
  buildRoute(authRoutes),
  buildRoute(dashboardRoutes),

  {
    path: SYSTEM_ROUTES.forbidden,
    element: <ForbiddenPage />,
  },

  {
    path: SYSTEM_ROUTES.notFound,
    element: <NotFoundPage />,
  },
]);