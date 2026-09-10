import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Collapse,
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
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import DynamicFormOutlinedIcon from "@mui/icons-material/DynamicFormOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

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
  sla: TimerOutlinedIcon,
  slaPolicies: PolicyOutlinedIcon,
  slaCalendars: CalendarMonthOutlinedIcon,
});

function hasActiveDescendant(item, pathname) {
  return (item.children ?? []).some(
    (child) =>
      pathname === child.path ||
      pathname.startsWith(`${child.path}/`) ||
      hasActiveDescendant(child, pathname),
  );
}

function filterNavigationItems(items, hasAllPermissions) {
  return items
    .filter((item) => hasAllPermissions(item.permissions ?? []))
    .map((item) => ({
      ...item,
      children: filterNavigationItems(item.children ?? [], hasAllPermissions),
    }));
}

function NavigationItem({ item, pathname, collapsed, onNavigate, depth = 0 }) {
  const Icon = ICONS[item.iconKey ?? item.icon];
  const children = item.children ?? [];
  const hasChildren = children.length > 0;

  const selected =
    pathname === item.path || pathname.startsWith(`${item.path}/`);

  const descendantActive = hasActiveDescendant(item, pathname);

  const [open, setOpen] = useState(selected || descendantActive);

  useEffect(() => {
    if (selected || descendantActive) {
      setOpen(true);
    }
  }, [selected, descendantActive]);

  if (collapsed) {
    if (hasChildren) {
      return (
        <Tooltip title={item.label} placement="right" arrow>
          <ListItemButton
            component={Link}
            to={children[0]?.path ?? item.path}
            selected={selected || descendantActive}
            onClick={onNavigate}
            sx={{
              mx: 0.5,
              mb: 0.5,
              minHeight: 44,
              borderRadius: 1.5,
              justifyContent: "center",
              px: 1,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: "center",
              }}
            >
              {Icon ? <Icon /> : null}
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={item.label} placement="right" arrow>
        <ListItemButton
          component={Link}
          to={item.path}
          selected={selected}
          onClick={onNavigate}
          sx={{
            mx: 0.5,
            mb: 0.5,
            minHeight: 44,
            borderRadius: 1.5,
            justifyContent: "center",
            px: 1,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              justifyContent: "center",
            }}
          >
            {Icon ? <Icon /> : null}
          </ListItemIcon>
        </ListItemButton>
      </Tooltip>
    );
  }

  return (
    <>
      <ListItemButton
        component={hasChildren ? "button" : Link}
        to={hasChildren ? undefined : item.path}
        selected={selected || descendantActive}
        onClick={
          hasChildren ? () => setOpen((current) => !current) : onNavigate
        }
        aria-expanded={hasChildren ? open : undefined}
        aria-haspopup={hasChildren ? "true" : undefined}
        sx={{
          mx: depth === 0 ? 1 : 0,
          mb: 0.5,
          minHeight: 44,
          borderRadius: 1.5,
          px: 1.5,
          justifyContent: "flex-start",
          width: depth === 0 ? "auto" : "100%",
        }}
      >
        
          <ListItemIcon
            sx={{
              minWidth: depth === 0 ? 36 : 32,
              mr: depth === 0 ? 0.5 : 0,
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            {Icon ? <Icon fontSize={depth === 0 ? "medium" : "small"} /> : null}
          </ListItemIcon>
       

        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ noWrap: true }}
          sx={{
            pl: 0,
          }}
        />

        {hasChildren ? (
          open ? (
            <ExpandLessOutlinedIcon fontSize="small" />
          ) : (
            <ExpandMoreOutlinedIcon fontSize="small" />
          )
        ) : null}
      </ListItemButton>

      {hasChildren ? (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List
            disablePadding
            component="div"
            sx={{
              pl: 2.5,
              pr: 1,
            }}
          >
            {children.map((child) => (
              <NavigationItem
                key={child.id}
                item={child}
                pathname={pathname}
                collapsed={false}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      ) : null}
    </>
  );
}

export default function Sidebar({ onNavigate, collapsed = false, onToggle }) {
  const location = useLocation();
  const { hasAllPermissions } = useAuth();
  const { navigation } = useAppConfig();

  const visibleItems = useMemo(
    () => filterNavigationItems(navigation.app, hasAllPermissions),
    [navigation.app, hasAllPermissions],
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
        {visibleItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            pathname={location.pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </List>
    </Box>
  );
}
