import { useState } from "react";
import { AppBar, Box, Button, Drawer, IconButton, Toolbar, Typography, useMediaQuery } from "@mui/material";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../context/useAuth";
import Sidebar from "../../components/navigation/Sidebar";

const DRAWER_WIDTH = 260;

export default function DashboardLayout() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar>
          {!desktop ? <IconButton color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}><MenuOutlinedIcon /></IconButton> : null}
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>CRM for HRMS</Typography>
          <Typography sx={{ mr: 2, display: { xs: "none", sm: "block" } }}>{user?.username ?? user?.email}</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {desktop ? (
          <Drawer variant="permanent" open sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}>
            <Sidebar />
          </Drawer>
        ) : (
          <Drawer variant="temporary" open={mobileOpen} onClose={closeMobile} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}>
            <Sidebar onNavigate={closeMobile} />
          </Drawer>
        )}
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}><Outlet /></Box>
      </Box>
    </Box>
  );
}
