import { lazy } from "react";

export const LandingPage = lazy(() => import("../pages/public/LandingPage"));

export const HomePage = lazy(() => import("../pages/public/HomePage"));
export const AboutPage = lazy(() => import("../pages/public/AboutPage"));
export const ContactPage = lazy(() => import("../pages/public/ContactPage"));

export const LoginPage = lazy(() => import("../modules/auth/pages/LoginPage"));
export const DashboardPage = lazy(
  () => import("../pages/dashboard/DashboardPage"),
);

export const UserManagementPage = lazy(
  () => import("../modules/users/pages/UserManagementPage"),
);
export const RoleManagementPage = lazy(
  () => import("../modules/roles/pages/RoleManagementPage"),
);

export const PublicTicketStatusPage = lazy(
  () => import("../modules/tickets/pages/PublicTicketStatusPage"),
);
export const TicketsListPage = lazy(
  () => import("../modules/tickets/pages/TicketsListPage"),
);
export const TicketCreatePage = lazy(
  () => import("../modules/tickets/pages/TicketCreatePage"),
);
export const TicketLifecyclePage = lazy(
  () => import("../modules/tickets/pages/TicketLifecyclePage"),
);

export const ForbiddenPage = lazy(
  () => import("../pages/common/ForbiddenPage"),
);
export const NotFoundPage = lazy(() => import("../pages/common/NotFoundPage"));
export const DefaultEntryPage = lazy(
  () => import("../pages/common/DefaultEntryPage"),
);

export const OptionManagementPage = lazy(
  () => import("../modules/options/pages/OptionManagementPage"),
);
export const ContactsManagementPage = lazy(
  () => import("../modules/contacts/pages/ContactsManagementPage"),
);

export const SlaPoliciesPage = lazy(
  () => import("../modules/sla/pages/SlaPoliciesPage"),
);
export const SlaPolicyCreatePage = lazy(
  () => import("../modules/sla/pages/SlaPolicyCreatePage"),
);
export const SlaPolicyDetailPage = lazy(
  () => import("../modules/sla/pages/SlaPolicyDetailPage"),
);
export const SlaCalendarsPage = lazy(
  () => import("../modules/sla/pages/SlaCalendarsPage"),
);
export const SlaCalendarDetailPage = lazy(
  () => import("../modules/sla/pages/SlaCalendarDetailPage"),
);

export const ReportsPage = lazy(
  () => import("../modules/reports/pages/ReportsPage"),
);

export const DashboardModulePage = lazy(
  () => import("../modules/dashboard/pages/DashboardPage"),
);
export const DashboardIndexRedirect = lazy(
  () => import("../modules/dashboard/pages/DashboardIndexRedirect"),
);
export const OperationalDashboard = lazy(
  () => import("../modules/dashboard/pages/OperationalDashboard"),
);
export const ManagementDashboard = lazy(
  () => import("../modules/dashboard/pages/ManagementDashboard"),
);
export const ProfessionalDashboard = lazy(
  () => import("../modules/dashboard/pages/ProfessionalDashboard"),
);
export const ExecutiveDashboard = lazy(
  () => import("../modules/dashboard/pages/ExecutiveDashboard"),
);
export const AuditDashboard = lazy(
  () => import("../modules/dashboard/pages/AuditDashboard"),
);
