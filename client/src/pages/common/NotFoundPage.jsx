
import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <Stack spacing={2} alignItems="center" justifyContent="center" minHeight="60vh">
      <Typography variant="h3">404</Typography>
      <Typography color="text.secondary">
        The requested page could not be found.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Go home
      </Button>
    </Stack>
  );
}
