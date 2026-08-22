import axios from "axios";
import { API_CONFIG } from "../../config/api.config";
import { AUTH_CONFIG } from "../../config/auth.config";
import { getStoredValue } from "../../utils/storage";

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,

});

let refreshPromise = null;
let onAuthenticationFailure = null;

export function setAuthenticationFailureHandler(handler) {
  onAuthenticationFailure = handler;
}

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getStoredValue(AUTH_CONFIG.storageKeys.accessToken);

    if (accessToken) {
      config.headers.Authorization = `${AUTH_CONFIG.tokenType} ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

async function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getStoredValue(AUTH_CONFIG.storageKeys.refreshToken);

    if (!refreshToken) {
      throw new Error("No refresh token is available.");
    }

    refreshPromise = axios
      .post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.refresh}`,
        { refreshToken },
        {
          timeout: API_CONFIG.timeout,
          headers: { "Content-Type": "application/json" },
        },
      )
      .then((response) => {
        const data = response.data?.data;

        if (!data?.accessToken || !data?.refreshToken) {
          throw new Error("Refresh response did not contain authentication tokens.");
        }

        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.endsWith(API_CONFIG.endpoints.auth.login) ||
      originalRequest.url?.endsWith(API_CONFIG.endpoints.auth.refresh) ||
      originalRequest.url?.endsWith(API_CONFIG.endpoints.auth.logout)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshed = await refreshAccessToken();

      localStorage.setItem(
        AUTH_CONFIG.storageKeys.accessToken,
        refreshed.accessToken,
      );
      localStorage.setItem(
        AUTH_CONFIG.storageKeys.refreshToken,
        refreshed.refreshToken,
      );

      originalRequest.headers.Authorization = `${AUTH_CONFIG.tokenType} ${refreshed.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      onAuthenticationFailure?.(refreshError);
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
