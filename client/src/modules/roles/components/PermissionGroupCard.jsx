import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";

import PermissionItem from "./PermissionItem";
import { getPermissionResourceLabel } from "../utils/permissionGrouping";

export default function PermissionGroupCard({
  resource,
  permissions,
  canEdit,
  saving,
  onPermissionChange,
}) {
  const label = getPermissionResourceLabel(resource);

  const selectedCount = permissions.reduce(
    (count, permission) => count + Number(permission.assigned),
    0,
  );

  const allSelected =
    permissions.length > 0 && selectedCount === permissions.length;

  const partiallySelected =
    selectedCount > 0 && selectedCount < permissions.length;

  const handleSelectAll = (event) => {
    const checked = event.target.checked;

    for (const permission of permissions) {
      if (permission.assigned !== checked) {
        onPermissionChange(permission.id, checked);
      }
    }
  };

  return (
    <Card
      component="section"
      variant="outlined"
      aria-label={`${label} permissions`}
      sx={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        transition: "border-color 150ms ease, box-shadow 150ms ease",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: 1,
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: 3,
          borderColor: "primary.main",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {label}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {selectedCount} of {permissions.length} enabled
            </Typography>
          </Box>

          <FormControlLabel
            sx={{ m: 0, flexShrink: 0 }}
            label="All"
            labelPlacement="start"
            control={
              <Checkbox
                checked={allSelected}
                indeterminate={partiallySelected}
                disabled={!canEdit || saving || permissions.length === 0}
                onChange={handleSelectAll}
                slotProps={{
                  input: {
                    "aria-label": `Select all ${label} permissions`,
                    "aria-checked": partiallySelected
                      ? "mixed"
                      : String(allSelected),
                  },
                }}
              />
            }
          />
        </Stack>
      </Box>

      <Divider />

      <CardContent
        sx={{
          p: 1,
          "&:last-child": { pb: 1 },
        }}
      >
        <Stack spacing={0.25}>
          {permissions.map((permission) => (
            <PermissionItem
              key={permission.id}
              permission={permission}
              disabled={!canEdit || saving}
              onChange={onPermissionChange}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
