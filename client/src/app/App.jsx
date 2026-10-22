import { RouterProvider } from "react-router";
import { router } from "../router";
import { AppProviders } from "./AppProviders";
import AppErrorBoundary from "../components/feedback/AppErrorBoundary";

export default function App() {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  );
}
