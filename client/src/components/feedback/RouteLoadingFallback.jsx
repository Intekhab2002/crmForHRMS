import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

export default function RouteLoadingFallback() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: 240,
        p: 3,
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <CircularProgress size={28} />

        <Typography variant="body2" color="text.secondary">
          Loading page...
        </Typography>
      </Stack>
    </Box>
  );
}