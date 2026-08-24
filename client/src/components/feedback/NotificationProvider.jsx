import {
  Alert,
  Snackbar,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const NotificationContext =
  createContext(null);

const DEFAULT_DURATION = 4000;

const DEFAULT_NOTIFICATION = {
  open: false,
  message: "",
  severity: "info",
  autoHideDuration:
    DEFAULT_DURATION,
};

function normalizeMessage(message) {
  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message;
  }

  if (
    message instanceof Error &&
    message.message
  ) {
    return message.message;
  }

  return "Something went wrong.";
}

export function NotificationProvider({
  children,
}) {
  const [notification, setNotification] =
    useState(DEFAULT_NOTIFICATION);

  const closeNotification =
    useCallback((_, reason) => {
      if (reason === "clickaway") {
        return;
      }

      setNotification((current) => ({
        ...current,
        open: false,
      }));
    }, []);

  const showNotification =
    useCallback(
      ({
        message,
        severity = "info",
        autoHideDuration =
          DEFAULT_DURATION,
      }) => {
        setNotification({
          open: true,
          message:
            normalizeMessage(message),
          severity,
          autoHideDuration,
        });
      },
      [],
    );

  const success = useCallback(
    (message, options = {}) => {
      showNotification({
        ...options,
        message,
        severity: "success",
      });
    },
    [showNotification],
  );

  const error = useCallback(
    (message, options = {}) => {
      showNotification({
        ...options,
        message,
        severity: "error",
      });
    },
    [showNotification],
  );

  const warning = useCallback(
    (message, options = {}) => {
      showNotification({
        ...options,
        message,
        severity: "warning",
      });
    },
    [showNotification],
  );

  const info = useCallback(
    (message, options = {}) => {
      showNotification({
        ...options,
        message,
        severity: "info",
      });
    },
    [showNotification],
  );

  const value = useMemo(
    () => ({
      showNotification,
      success,
      error,
      warning,
      info,
      closeNotification,
    }),
    [
      showNotification,
      success,
      error,
      warning,
      info,
      closeNotification,
    ],
  );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}

      <Snackbar
        open={notification.open}
        autoHideDuration={
          notification.autoHideDuration
        }
        onClose={closeNotification}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: "100%",
            minWidth: {
              xs: "auto",
              sm: 360,
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context =
    useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider.",
    );
  }

  return context;
}