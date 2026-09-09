import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import DynamicFormOutlinedIcon from "@mui/icons-material/DynamicFormOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';

import { Link, useLocation } from "react-router";

import { useAuth } from "../../context/useAuth";
import { useAppConfig } from "../../context/useAppConfig";

const ICONS = Object.freeze({
  dashboard: DashboardOutlinedIcon,
  users: PeopleOutlinedIcon,
  tickets: ConfirmationNumberOutlinedIcon,
  formConfiguration: DynamicFormOutlinedIcon,
  roles: AdminPanelSettingsOutlinedIcon,
  options: TuneOutlinedIcon,
  sla:TimerOutlinedIcon
});

export default function Sidebar({ onNavigate, collapsed = false, onToggle }) {
  const location = useLocation();
  const { hasAllPermissions } = useAuth();
  const { navigation } = useAppConfig();

  const visibleItems = navigation.app.filter((item) =>
    hasAllPermissions(item.permissions ?? []),
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          px: collapsed ? 1 : 2,
          justifyContent: collapsed ? "center" : "space-between",
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <Tooltip title="Expand navigation" placement="right" arrow>
            <IconButton
              onClick={onToggle}
              aria-label="Expand navigation"
              size="small"
            >
              <ChevronRightOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Typography
              fontWeight={800}
              noWrap
              sx={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              CRM for HRMS
            </Typography>

            {onToggle ? (
              <Tooltip title="Collapse navigation" placement="right" arrow>
                <IconButton
                  onClick={onToggle}
                  aria-label="Collapse navigation"
                  size="small"
                >
                  <ChevronLeftOutlinedIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </>
        )}
      </Toolbar>

      <List
        disablePadding
        sx={{
          px: collapsed ? 0.75 : 0,
          pb: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
      >
        {visibleItems.map((item) => {
          const Icon = ICONS[item.iconKey ?? item.icon];

          const selected =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          const button = (
            <ListItemButton
              key={item.id}
              component={Link}
              to={item.path}
              selected={selected}
              onClick={onNavigate}
              sx={{
                mx: collapsed ? 0.5 : 1,
                mb: 0.5,
                minHeight: 44,
                borderRadius: 1.5,
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1 : 1.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  mr: collapsed ? 0 : 0.5,
                  justifyContent: "center",
                }}
              >
                {Icon ? <Icon /> : null}
              </ListItemIcon>

              {!collapsed ? <ListItemText primary={item.label} /> : null}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={item.id} title={item.label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
    </Box>
  );
}
