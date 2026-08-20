
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "../context/AuthContext";
import { AppConfigProvider } from "../context/AppConfigContext";
import theme from "../theme";

export function AppProviders({ children }) {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </AppConfigProvider>
  );
}
