import { Outlet, createBrowserRouter } from "react-router";
import PublicLayout from "../layouts/PublicLayout/PublicLayout";
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import HomePage from "../pages/public/HomePage";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import PublicTicketStatusPage from "../modules/tickets/pages/PublicTicketStatusPage";
import TicketsListPage from "../modules/tickets/pages/TicketsListPage";
import TicketCreatePage from "../modules/tickets/pages/TicketCreatePage";
import TicketLifecyclePage from "../modules/tickets/pages/TicketLifecyclePage";
import ForbiddenPage from "../pages/common/ForbiddenPage";
import NotFoundPage from "../pages/common/NotFoundPage";
import DefaultEntryPage from "../pages/common/DefaultEntryPage";
import LoginPage from "../modules/auth/pages/LoginPage";
import UserManagementPage from "../modules/users/pages/UserManagementPage";
import { APP_MODULE_CONFIG, SYSTEM_ROUTES } from "../config/module.config";
import FormConfigurationPage
  from "../modules/formConfiguration/pages/FormConfigurationPage";

import PermissionRoute from "./PermissionRoute";

const LAYOUTS = Object.freeze({ public: PublicLayout, auth: AuthLayout, dashboard: DashboardLayout });
const GUARDS = Object.freeze({ auth: ProtectedRoute, guest: PublicRoute });
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
  formConfiguration: FormConfigurationPage,
});

function withAccess(route, element) {
  let protectedElement = element ?? <Outlet />;

  if (route.access?.roles?.length) {
    protectedElement = (
      <RoleRoute roles={route.access.roles}>
        {protectedElement}
      </RoleRoute>
    );
  }

  if (route.access?.permissions?.length) {
    protectedElement = (
      <PermissionRoute
        allPermissions={route.access.permissions}
      >
        {protectedElement}
      </PermissionRoute>
    );
  }

  return protectedElement;
}

function buildRoute(route) {
  const Guard = route.guard ? GUARDS[route.guard] : null;
  const Layout = route.layout ? LAYOUTS[route.layout] : null;
  const Component = route.component ? COMPONENTS[route.component] : null;

  let element = Component ? <Component /> : <Outlet />;
  element = withAccess(route, element);
  if (Layout) element = <Layout />;
  if (Guard) element = <Guard />;

  const result = { element };
  if (route.path) result.path = route.path;
  if (route.index) result.index = true;
  if (route.children?.length) result.children = route.children.map(buildRoute);
  return result;
}

const publicRoutes = {
  layout: APP_MODULE_CONFIG.public.layout,
  children: APP_MODULE_CONFIG.public.routes,
};

const authRoutes = {
  guard: "guest",
  children: [{ layout: APP_MODULE_CONFIG.auth.layout, children: APP_MODULE_CONFIG.auth.routes }],
};

const dashboardRoutes = {
  guard: "auth",
  children: [{ layout: APP_MODULE_CONFIG.dashboard.layout, children: APP_MODULE_CONFIG.dashboard.routes }],
};

export const router = createBrowserRouter([
  { path: SYSTEM_ROUTES.defaultEntry, element: <DefaultEntryPage /> },
  buildRoute(publicRoutes),
  buildRoute(authRoutes),
  buildRoute(dashboardRoutes),
  { path: SYSTEM_ROUTES.forbidden, element: <ForbiddenPage /> },
  { path: SYSTEM_ROUTES.notFound, element: <NotFoundPage /> },
]);
