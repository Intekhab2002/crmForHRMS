
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Outlet } from "react-router";
import { useAppConfig } from "../../context/useAppConfig";

export default function PublicLayout() {
  const { navigation } = useAppConfig();

  return (
    <Box minHeight="100vh">
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography
            component={Link}
            to="/"
            variant="h6"
            color="inherit"
            sx={{
              textDecoration: "none",
              flexGrow: 1,
            }}
          >
            CRM for HRMS
          </Typography>

          {navigation.public.map((item) => (
            <Button
              key={item.id}
              color="inherit"
              component={Link}
              to={item.path}
            >
              {item.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Outlet />
      </Container>
    </Box>
  );
}