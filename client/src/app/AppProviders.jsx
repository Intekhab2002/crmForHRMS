import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "../context/AuthContext";
import { AppConfigProvider } from "../context/AppConfigContext";
import theme from "../theme";
import { NotificationProvider } from "../components/feedback";

export function AppProviders({ children }) {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </AppConfigProvider>
  );
}
