import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AUTH_CONFIG } from "../config/auth.config";
import { authService } from "../modules/auth/services/auth.service";
import {
  clearStoredAuth,
  getStoredJson,
  getStoredValue,
  setStoredJson,
  setStoredValue,
} from "../utils/storage";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  hasRole,
  normalizePermissions,
  normalizeRoles,
} from "../utils/permissions";
import { setAuthenticationFailureHandler } from "../services/api/apiClient";
import { AuthContext } from "./AuthContextValue";


function extractAuthData(response) {
  return response?.data ?? response;
}

function buildPrincipal(data) {
  const user = data?.user ?? data ?? null;

  return {
    user,
    roles: normalizeRoles(data?.roles ?? user?.roles ?? []),
    permissions: normalizePermissions(
      data?.permissions ?? user?.permissions ?? [],
    ),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [status, setStatus] = useState("initializing");

  const clearAuthentication = useCallback(() => {
    clearStoredAuth(AUTH_CONFIG.storageKeys);
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setStatus("unauthenticated");
  }, []);

  const applyAuthentication = useCallback((data) => {
    const principal = buildPrincipal(data);

    if (principal.user) {
      setStoredJson(AUTH_CONFIG.storageKeys.user, principal.user);
      setUser(principal.user);
    }

    setRoles(principal.roles);
    setPermissions(principal.permissions);
    setStatus("authenticated");

    return principal;
  }, []);

  const login = useCallback(
    async (credentials) => {
      setStatus("authenticating");

      try {
        const response = await authService.login(credentials);
        const data = extractAuthData(response);

        if (!data?.accessToken || !data?.refreshToken || !data?.user) {
          throw new Error("Invalid authentication response.");
        }

        setStoredValue(
          AUTH_CONFIG.storageKeys.accessToken,
          data.accessToken,
        );
        setStoredValue(
          AUTH_CONFIG.storageKeys.refreshToken,
          data.refreshToken,
        );

        return applyAuthentication(data);
      } catch (error) {
        clearAuthentication();
        throw error;
      }
    },
    [applyAuthentication, clearAuthentication],
  );

  const logout = useCallback(async () => {
    try {
      if (getStoredValue(AUTH_CONFIG.storageKeys.accessToken)) {
        await authService.logout();
      }
    } finally {
      clearAuthentication();
    }
  }, [clearAuthentication]);

  const restoreSession = useCallback(async () => {
    const accessToken = getStoredValue(AUTH_CONFIG.storageKeys.accessToken);
    const refreshToken = getStoredValue(AUTH_CONFIG.storageKeys.refreshToken);

    if (!accessToken && !refreshToken) {
      setStatus("unauthenticated");
      return;
    }

    try {
      const response = await authService.me();
      const data = extractAuthData(response);

      const storedUser = getStoredJson(AUTH_CONFIG.storageKeys.user);
      applyAuthentication({
        user: data?.user ?? data ?? storedUser,
        roles: data?.roles,
        permissions: data?.permissions,
      });
    } catch {
      if (!refreshToken) {
        clearAuthentication();
        return;
      }

      try {
        const response = await authService.refresh(refreshToken);
        const data = extractAuthData(response);

        setStoredValue(
          AUTH_CONFIG.storageKeys.accessToken,
          data.accessToken,
        );
        setStoredValue(
          AUTH_CONFIG.storageKeys.refreshToken,
          data.refreshToken,
        );

        applyAuthentication(data);
      } catch {
        clearAuthentication();
      }
    }
  }, [applyAuthentication, clearAuthentication]);

useEffect(() => {
  setAuthenticationFailureHandler(() => {
    clearAuthentication();
  });

  let cancelled = false;

  const initializeSession = async () => {
    if (cancelled) {
      return;
    }

    await restoreSession();
  };

  void initializeSession();

  return () => {
    cancelled = true;
  };
}, [clearAuthentication, restoreSession]);

  const value = useMemo(
    () => ({
      user,
      roles,
      permissions,
      status,
      isInitializing: status === "initializing",
      isAuthenticating: status === "authenticating",
      isAuthenticated: status === "authenticated",
      login,
      logout,
      restoreSession,
      hasPermission: (permission) =>
        hasPermission(permissions, permission),
      hasRole: (role) => hasRole(roles, role),
      hasAnyPermission: (required) =>
        hasAnyPermission(permissions, required),
      hasAllPermissions: (required) =>
        hasAllPermissions(permissions, required),
    }),
    [
      login,
      logout,
      permissions,
      restoreSession,
      roles,
      status,
      user,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

