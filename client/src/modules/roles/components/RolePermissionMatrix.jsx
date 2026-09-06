import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  roleService,
} from "../services/role.service";

import {
  PERMISSION_RESOURCE_CONFIG,
} from "../../../config/permission.config";

function normalizeMatrix(response) {
  const data = response?.data ?? response ?? [];

  return Array.isArray(data) ? data : [];
}

function normalizePermission(permission) {
  const resource =
    permission.resource ??
    permission.module ??
    permission.code?.split(":")[0] ??
    "other";

  const action =
    permission.action ??
    permission.code?.split(":")[1] ??
    "";

  return {
    id: permission.id,
    code: permission.code ?? "",
    name:
      permission.name ??
      permission.code ??
      "",
    resource,
    action,
    assigned: Boolean(
      permission.assigned ??
        permission.isAssigned ??
        permission.enabled,
    ),
  };
}

function normalizeResourceLabel(resource) {
  const configuredLabel =
    PERMISSION_RESOURCE_CONFIG?.[resource]
      ?.label;

  if (configuredLabel) {
    return configuredLabel;
  }

  if (!resource) {
    return "Other";
  }

  return resource
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function groupPermissions(permissions) {
  const grouped = new Map();

  permissions.forEach((permission) => {
    if (!grouped.has(permission.resource)) {
      grouped.set(permission.resource, []);
    }

    grouped
      .get(permission.resource)
      .push(permission);
  });

  return [...grouped.entries()];
}

function PermissionItem({
  permission,
  disabled,
  onChange,
}) {
  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        width: "100%",
        minHeight: 38,
        px: 1,
        borderRadius: 1,
        cursor: disabled
          ? "default"
          : "pointer",
        transition:
          "background-color 120ms ease",

        "&:hover": {
          bgcolor: disabled
            ? "transparent"
            : "action.hover",
        },
      }}
    >
      <Typography
        variant="body2"
        color="text.primary"
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        {permission.name}
      </Typography>

      <Checkbox
        size="small"
        checked={permission.assigned}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            permission.id,
            event.target.checked,
          )
        }
        inputProps={{
          "aria-label": permission.name,
        }}
      />
    </Box>
  );
}

function PermissionModuleCard({
  resource,
  permissions,
  canEdit,
  saving,
  onPermissionChange,
}) {
  const selectedCount = permissions.filter(
    (permission) => permission.assigned,
  ).length;

  const allSelected =
    permissions.length > 0 &&
    selectedCount === permissions.length;

  const partiallySelected =
    selectedCount > 0 &&
    selectedCount < permissions.length;

  const handleSelectAll = (event) => {
    const checked = event.target.checked;

    permissions.forEach((permission) => {
      if (permission.assigned !== checked) {
        onPermissionChange(
          permission.id,
          checked,
        );
      }
    });
  };

  const moduleLabel =
    normalizeResourceLabel(resource);

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          borderTop: 3,
          borderColor: "primary.main",
          px: 1.75,
          py: 1.25,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Box
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={800}
              noWrap
            >
              {moduleLabel}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {selectedCount} of{" "}
              {permissions.length} enabled
            </Typography>
          </Box>

          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={
              partiallySelected
            }
            disabled={
              !canEdit ||
              saving ||
              permissions.length === 0
            }
            onChange={
              handleSelectAll
            }
            inputProps={{
              "aria-label": `Select all ${moduleLabel} permissions`,
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
          {permissions.map(
            (permission) => (
              <PermissionItem
                key={permission.id}
                permission={permission}
                disabled={
                  !canEdit || saving
                }
                onChange={
                  onPermissionChange
                }
              />
            ),
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function RolePermissionMatrix({
  role,
  open,
  onClose,
  canEdit = false,
}) {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    permissions,
    setPermissions,
  ] = useState([]);

  useEffect(() => {
    if (!open || !role?.id) {
      return undefined;
    }

    let cancelled = false;

    async function loadMatrix() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await roleService.getPermissionMatrix(
            role.id,
          );

        if (!cancelled) {
          setPermissions(
            normalizeMatrix(response).map(
              normalizePermission,
            ),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.response
              ?.data?.message ??
              requestError?.response
                ?.data?.error?.message ??
              requestError?.message ??
              "Unable to load role permissions.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMatrix();

    return () => {
      cancelled = true;
    };
  }, [open, role?.id]);

  const modules = useMemo(
    () => groupPermissions(permissions),
    [permissions],
  );

  const handlePermissionChange = (
    permissionId,
    checked,
  ) => {
    if (!canEdit || saving) {
      return;
    }

    setPermissions((current) =>
      current.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              assigned: checked,
            }
          : permission,
      ),
    );
  };

  const handleSave = async () => {
    if (!canEdit || !role?.id) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const permissionIds =
        permissions
          .filter(
            (permission) =>
              permission.assigned,
          )
          .map(
            (permission) =>
              permission.id,
          );

      const response =
        await roleService.replacePermissions(
          role.id,
          permissionIds,
        );

      setSuccess(
        response?.message ??
          "Role permissions updated successfully.",
      );
    } catch (requestError) {
      setError(
        requestError?.response
          ?.data?.message ??
          requestError?.response
            ?.data?.error?.message ??
          requestError?.message ??
          "Unable to update role permissions.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
         minWidth: 0,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            spacing={1}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
              >
                Permission Matrix
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Configure permissions for{" "}
                {role?.name ??
                  role?.code}
              </Typography>
            </Box>

            <Button
              variant="text"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </Button>
          </Stack>

          {error ? (
            <Alert
              severity="error"
              onClose={() =>
                setError("")
              }
            >
              {error}
            </Alert>
          ) : null}

          {success ? (
            <Alert
              severity="success"
              onClose={() =>
                setSuccess("")
              }
            >
              {success}
            </Alert>
          ) : null}

          {loading ? (
            <Box
              sx={{
                minHeight: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress
                size={28}
                aria-label="Loading permissions"
              />
            </Box>
          ) : permissions.length ===
            0 ? (
            <Alert severity="info">
              No active permissions are
              available for this role.
            </Alert>
          ) : (
            <Grid
              container
              spacing={2}
              alignItems="stretch"
            >
              {modules.map(
                ([
                  resource,
                  modulePermissions,
                ]) => (
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
                    <PermissionModuleCard
                      resource={resource}
                      permissions={
                        modulePermissions
                      }
                      canEdit={canEdit}
                      saving={saving}
                      onPermissionChange={
                        handlePermissionChange
                      }
                    />
                  </Grid>
                ),
              )}
            </Grid>
          )}

          {canEdit &&
          !loading &&
          permissions.length > 0 ? (
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={1}
              sx={{
                pt: 0.5,
              }}
            >
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                startIcon={
                  <SaveOutlinedIcon />
                }
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save permissions"}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}