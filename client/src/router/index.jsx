import { Outlet, createBrowserRouter } from "react-router";
import { Suspense } from "react";

import PublicLayout from "../layouts/PublicLayout/PublicLayout";
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import PermissionRoute from "./PermissionRoute";

import RouteErrorPage from "../components/feedback/RouteErrorPage";
import RouteLoadingFallback from "../components/feedback/RouteLoadingFallback";

import { APP_MODULE_CONFIG, SYSTEM_ROUTES } from "../config/module.config";

import {
  LandingPage,
  HomePage,
  AboutPage,
  ContactPage,
  LoginPage,
  DashboardPage,
  UserManagementPage,
  RoleManagementPage,
  PublicTicketStatusPage,
  TicketsListPage,
  TicketCreatePage,
  TicketLifecyclePage,
  ForbiddenPage,
  NotFoundPage,
  OptionManagementPage,
  ContactsManagementPage,
  SlaPoliciesPage,
  SlaPolicyCreatePage,
  SlaPolicyDetailPage,
  SlaCalendarsPage,
  SlaCalendarDetailPage,
  ReportsPage,
  DashboardModulePage,
  DashboardIndexRedirect,
  OperationalDashboard,
  ManagementDashboard,
  ProfessionalDashboard,
  ExecutiveDashboard,
  AuditDashboard,
} from "./routeComponents";

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
  roles: RoleManagementPage,

  publicTicketStatus: PublicTicketStatusPage,
  ticketsList: TicketsListPage,
  ticketCreate: TicketCreatePage,
  ticketLifecycle: TicketLifecyclePage,

  forbidden: ForbiddenPage,
  notFound: NotFoundPage,

  options: OptionManagementPage,
  contacts: ContactsManagementPage,

  slaPolicies: SlaPoliciesPage,
  slaPolicyCreate: SlaPolicyCreatePage,
  slaPolicyDetail: SlaPolicyDetailPage,
  slaCalendars: SlaCalendarsPage,
  slaCalendarDetail: SlaCalendarDetailPage,

  reports: ReportsPage,

  dashboardModule: DashboardModulePage,
  dashboardIndexRedirect: DashboardIndexRedirect,
  dashboardOperational: OperationalDashboard,
  dashboardManagement: ManagementDashboard,
  dashboardProfessional: ProfessionalDashboard,
  dashboardExecutive: ExecutiveDashboard,
  dashboardAudit: AuditDashboard,
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
