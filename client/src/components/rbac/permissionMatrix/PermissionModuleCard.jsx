import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import PermissionItem from "./PermissionItem";

function PermissionModuleCard({
  module,
  permissions,
  selectedPermissionIds,
  disabled = false,
  onPermissionChange,
}) {
  const selectedCount = permissions.reduce(
    (count, permission) =>
      count +
      (selectedPermissionIds.has(permission.id) ? 1 : 0),
    0,
  );

  const allSelected =
    permissions.length > 0 &&
    selectedCount === permissions.length;

  const partiallySelected =
    selectedCount > 0 && !allSelected;

  const handleModuleChange = (event) => {
    const shouldSelect = event.target.checked;

    permissions.forEach((permission) => {
      const currentlySelected =
        selectedPermissionIds.has(permission.id);

      if (currentlySelected !== shouldSelect) {
        onPermissionChange(permission, shouldSelect);
      }
    });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 2,
        bgcolor: "background.paper",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease",

        "&:hover": {
          borderColor: "divider",
          boxShadow: 1,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          px: 1.75,
          py: 1.25,
          borderTop: 3,
          borderColor: "primary.main",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Box minWidth={0}>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              noWrap
            >
              {module.label}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {selectedCount} of {permissions.length} enabled
            </Typography>
          </Box>

          <Checkbox
            checked={allSelected}
            indeterminate={partiallySelected}
            disabled={disabled || permissions.length === 0}
            onChange={handleModuleChange}
            size="small"
            inputProps={{
              "aria-label": `Select all ${module.label} permissions`,
            }}
          />
        </Stack>
      </Box>

      <Divider />

      <CardContent
        sx={{
          p: 1,
          "&:last-child": {
            pb: 1,
          },
        }}
      >
        <Stack spacing={0.25}>
          {permissions.map((permission) => (
            <PermissionItem
              key={permission.id}
              permission={permission}
              checked={selectedPermissionIds.has(
                permission.id,
              )}
              disabled={disabled}
              onChange={onPermissionChange}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PermissionModuleCard;