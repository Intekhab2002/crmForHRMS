import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";

import { useAuth } from "../../context/useAuth";
import Sidebar from "../../components/navigation/Sidebar";

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 72;

export default function DashboardLayout() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { user, logout } = useAuth();

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const desktopDrawerWidth = sidebarCollapsed
    ? COLLAPSED_DRAWER_WIDTH
    : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: {
            md: `calc(100% - ${desktopDrawerWidth}px)`,
          },
          ml: {
            md: `${desktopDrawerWidth}px`,
          },
          transition: (themeValue) =>
            themeValue.transitions.create(["width", "margin"], {
              duration: themeValue.transitions.duration.standard,
            }),
        }}
      >
        <Toolbar>
          {!desktop ? (
            <IconButton
              color="inherit"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
              aria-label="Open navigation"
            >
              <MenuOutlinedIcon />
            </IconButton>
          ) : null}

          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            CRM for HRMS
          </Typography>

          <Typography
            sx={{
              mr: 2,
              display: {
                xs: "none",
                sm: "block",
              },
            }}
          >
            {user?.username ?? user?.email}
          </Typography>

          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: {
            md: desktopDrawerWidth,
          },
          flexShrink: {
            md: 0,
          },
          transition: (themeValue) =>
            themeValue.transitions.create("width", {
              duration: themeValue.transitions.duration.standard,
            }),
        }}
      >
        {desktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              width: desktopDrawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: desktopDrawerWidth,
                boxSizing: "border-box",
                overflowX: "hidden",
                transition: (themeValue) =>
                  themeValue.transitions.create("width", {
                    duration: themeValue.transitions.duration.standard,
                  }),
              },
            }}
          >
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed((current) => !current)}
            />
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={closeMobile}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
              },
            }}
          >
            <Sidebar onNavigate={closeMobile} />
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Toolbar />

        <Box
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
