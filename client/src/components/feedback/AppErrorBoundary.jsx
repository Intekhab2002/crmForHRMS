
import { Component } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

export default class AppErrorBoundary extends Component {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Connect this to your existing client-side error-reporting service
    // when one is configured. Avoid logging sensitive user data.
    console.error("Application render error", {
      message: error?.message,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        role="alert"
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 520 }}>
          <Alert severity="error">
            Something went wrong while displaying this page.
          </Alert>

          <Typography variant="h5" fontWeight={700}>
            We couldn&apos;t display this screen
          </Typography>

          <Typography color="text.secondary">
            Your current data has not necessarily been lost. Try reloading
            the page. If the problem continues, contact your support team.
          </Typography>

          <Box>
            <Button
              variant="contained"
              startIcon={<RefreshOutlinedIcon />}
              onClick={this.handleReload}
            >
              Reload application
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  }
}
