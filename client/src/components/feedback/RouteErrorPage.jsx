
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router";

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? "The page you're looking for could not be found."
      : "The requested page could not be displayed."
    : "An unexpected error occurred while displaying this page.";

  return (
    <Box
      role="alert"
      sx={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 520 }}>
        <Alert severity="error">
          We couldn't open this page.
        </Alert>

        <Typography variant="h4" fontWeight={700}>
          Something went wrong
        </Typography>

        <Typography color="text.secondary">{message}</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<HomeOutlinedIcon />}
            onClick={() => navigate("/", { replace: true })}
          >
            Go to home
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
