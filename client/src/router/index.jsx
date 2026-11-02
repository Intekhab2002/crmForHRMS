import { Outlet, createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";

import PublicLayout from "../layouts/PublicLayout/PublicLayout";
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import PermissionRoute from "./PermissionRoute";

import RouteErrorPage from "../components/feedback/RouteErrorPage";
import RouteLoadingFallback from "../components/feedback/RouteLoadingFallback";

import { APP_MODULE_CONFIG, SYSTEM_ROUTES } from "../config/module.config";
const LandingPage = lazy(() => import("../pages/public/LandingPage"));

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
  home: lazy(() => import("../pages/public/HomePage")),
  about: lazy(() => import("../pages/public/AboutPage")),
  contact: lazy(() => import("../pages/public/ContactPage")),

  login: lazy(() => import("../modules/auth/pages/LoginPage")),

  dashboard: lazy(() => import("../pages/dashboard/DashboardPage")),

  users: lazy(() => import("../modules/users/pages/UserManagementPage")),

  roles: lazy(() => import("../modules/roles/pages/RoleManagementPage")),

  publicTicketStatus: lazy(
    () => import("../modules/tickets/pages/PublicTicketStatusPage"),
  ),

  ticketsList: lazy(() => import("../modules/tickets/pages/TicketsListPage")),

  ticketCreate: lazy(() => import("../modules/tickets/pages/TicketCreatePage")),

  ticketLifecycle: lazy(
    () => import("../modules/tickets/pages/TicketLifecyclePage"),
  ),

  forbidden: lazy(() => import("../pages/common/ForbiddenPage")),

  notFound: lazy(() => import("../pages/common/NotFoundPage")),

  defaultEntry: lazy(() => import("../pages/common/DefaultEntryPage")),

  options: lazy(() => import("../modules/options/pages/OptionManagementPage")),

  contacts: lazy(
    () => import("../modules/contacts/pages/ContactsManagementPage"),
  ),

  slaPolicies: lazy(() => import("../modules/sla/pages/SlaPoliciesPage")),

  slaPolicyCreate: lazy(
    () => import("../modules/sla/pages/SlaPolicyCreatePage"),
  ),

  slaPolicyDetail: lazy(
    () => import("../modules/sla/pages/SlaPolicyDetailPage"),
  ),

  slaCalendars: lazy(() => import("../modules/sla/pages/SlaCalendarsPage")),

  slaCalendarDetail: lazy(
    () => import("../modules/sla/pages/SlaCalendarDetailPage"),
  ),

  reports: lazy(() => import("../modules/reports/pages/ReportsPage")),

  dashboardModule: lazy(
    () => import("../modules/dashboard/pages/DashboardPage"),
  ),

  dashboardIndexRedirect: lazy(
    () => import("../modules/dashboard/pages/DashboardIndexRedirect"),
  ),

  dashboardOperational: lazy(
    () => import("../modules/dashboard/pages/OperationalDashboard"),
  ),

  dashboardManagement: lazy(
    () => import("../modules/dashboard/pages/ManagementDashboard"),
  ),

  dashboardProfessional: lazy(
    () => import("../modules/dashboard/pages/ProfessionalDashboard"),
  ),

  dashboardExecutive: lazy(
    () => import("../modules/dashboard/pages/ExecutiveDashboard"),
  ),

  dashboardAudit: lazy(
    () => import("../modules/dashboard/pages/AuditDashboard"),
  ),
});

function applyPermissionGuard(route, element) {
  const permissions = route.access?.permissions ?? [];

  if (!permissions.length) {
    return element;
  }

  return (
    <PermissionRoute allPermissions={permissions}>{element}</PermissionRoute>
  );
}

function buildRoute(route) {
  const Guard = route.guard ? GUARDS[route.guard] : null;

  const Layout = route.layout ? LAYOUTS[route.layout] : null;

  const Component = route.component ? COMPONENTS[route.component] : null;

  /*
   * Layout routes own the Outlet.
   * Component routes render their component.
   */
  let element = Layout ? (
    <Layout />
  ) : Component ? (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Component />
    </Suspense>
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
    element = <Guard>{element}</Guard>;
  }

  const result = {
    element,
    errorElement: <RouteErrorPage />,
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
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LandingPage />
      </Suspense>
    ),
    errorElement: <RouteErrorPage />,
  },

  {
    ...buildRoute(publicRoutes),
    errorElement: <RouteErrorPage />,
  },

  {
    ...buildRoute(authRoutes),
    errorElement: <RouteErrorPage />,
  },

  {
    ...buildRoute(dashboardRoutes),
    errorElement: <RouteErrorPage />,
  },

  {
    path: SYSTEM_ROUTES.forbidden,
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <COMPONENTS.forbidden />
      </Suspense>
    ),
    errorElement: <RouteErrorPage />,
  },

  {
    path: SYSTEM_ROUTES.notFound,
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <COMPONENTS.notFound />
      </Suspense>
    ),
    errorElement: <RouteErrorPage />,
  },
]);
