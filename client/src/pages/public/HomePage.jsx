
import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

export default function HomePage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h2" fontWeight={800}>
        CRM for HRMS
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Production-ready CRM foundation with configurable authentication,
        authorization, tickets, employees, and dashboards.
      </Typography>
      <Button component={Link} to="/login" variant="contained" sx={{ width: "fit-content" }}>
        Sign in
      </Button>
    </Stack>
  );
}
