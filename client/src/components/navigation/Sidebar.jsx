import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import DynamicFormOutlinedIcon from "@mui/icons-material/DynamicFormOutlined";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";


import { Link, useLocation } from "react-router";

import { useAuth } from "../../context/useAuth";
import { useAppConfig } from "../../context/useAppConfig";

const ICONS = Object.freeze({
  dashboard: DashboardOutlinedIcon,
  users: PeopleOutlinedIcon,
  tickets: ConfirmationNumberOutlinedIcon,
  formConfiguration: DynamicFormOutlinedIcon,
  roles: AdminPanelSettingsIcon,
  options: TuneOutlinedIcon,
});

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const { hasAllPermissions } = useAuth();
  const { navigation } = useAppConfig();

  const visibleItems = navigation.app.filter((item) =>
    hasAllPermissions(item.permissions ?? []),
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Toolbar>
        <Typography fontWeight={800}>
          CRM for HRMS
        </Typography>
      </Toolbar>

      <List disablePadding>
        {visibleItems.map((item) => {
          const Icon = ICONS[item.iconKey ?? item.icon];

          const selected =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <ListItemButton
              key={item.id}
              component={Link}
              to={item.path}
              selected={selected}
              onClick={onNavigate}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1.5,
              }}
            >
              {Icon ? <Icon sx={{ mr: 1.5 }} /> : null}

              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}