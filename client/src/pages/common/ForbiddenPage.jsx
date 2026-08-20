
import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

export default function ForbiddenPage() {
  return (
    <Stack spacing={2} alignItems="center" justifyContent="center" minHeight="60vh">
      <Typography variant="h3">403</Typography>
      <Typography color="text.secondary">
        You do not have permission to access this resource.
      </Typography>
      <Button component={Link} to="/dashboard" variant="contained">
        Back to dashboard
      </Button>
    </Stack>
  );
}
