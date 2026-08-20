import { Navigate } from "react-router";
import { useAuth } from "../../context/useAuth";

export default function DefaultEntryPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
