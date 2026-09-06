import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import PermissionModuleCard from "./PermissionModuleCard";
import  PERMISSION_RESOURCE_CONFIG  from "../../../config/permission.config";

function normalizeResourceLabel(resource) {
  if (!resource) {
    return "";
  }

  return resource
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function groupPermissions(permissions) {
  return permissions.reduce((groups, permission) => {
    const resource = permission.resource || "other";

    if (!groups.has(resource)) {
      groups.set(resource, []);
    }

    groups.get(resource).push(permission);

    return groups;
  }, new Map());
}

function PermissionMatrix({
  permissions = [],
  selectedPermissionIds = [],
  loading = false,
  disabled = false,
  error = null,
  onChange,
}) {
  const selectedIds = new Set(selectedPermissionIds.filter(Boolean));

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} aria-label="Loading permissions" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!permissions.length) {
    return (
      <Alert severity="info">
        No active permissions are available for configuration.
      </Alert>
    );
  }

  const groupedPermissions = groupPermissions(permissions);

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle1" fontWeight={800}>
          Permissions
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Configure access independently for each module and action.
        </Typography>
      </Box>

      <Grid container spacing={2} alignItems="stretch">
        {[...groupedPermissions.entries()].map(
          ([resource, resourcePermissions]) => (
            <Grid
              key={resource}
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
              }}
              sx={{
                display: "flex",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                }}
              >
                <PermissionModuleCard
                  module={{
                    key: resource,
                    label:
                      PERMISSION_RESOURCE_CONFIG[resource]?.label ||
                      normalizeResourceLabel(resource),
                  }}
                  permissions={resourcePermissions}
                  selectedPermissionIds={selectedIds}
                  disabled={disabled}
                  onPermissionChange={onChange}
                />
              </Box>
            </Grid>
          ),
        )}
      </Grid>
    </Stack>
  );
}

export default PermissionMatrix;
