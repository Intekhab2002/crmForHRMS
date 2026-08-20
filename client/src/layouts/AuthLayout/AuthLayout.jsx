
import { Box, Container, Paper, Typography } from "@mui/material";
import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
      py={4}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          mb={3}
        >
          CRM for HRMS
        </Typography>
        <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 } }}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
