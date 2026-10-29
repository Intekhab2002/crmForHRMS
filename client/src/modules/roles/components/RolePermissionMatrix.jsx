import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

import { roleService } from "../services/role.service";
import { useNotification } from "../../../components/feedback/useNotification";

import PermissionGroupCard from "../components/PermissionGroupCard";

import {
  filterPermissions,
  groupPermissions,
  normalizePermission,
  getPermissionResourceLabel,
} from "../utils/permissionGrouping";

function normalizeMatrix(response) {
  const data = response?.data ?? response ?? [];
  return Array.isArray(data) ? data : [];
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error?.message ??
    error?.message ??
    "Unable to complete the request."
  );
}

function getAssignedIds(permissions) {
  return permissions
    .filter((permission) => permission.assigned)
    .map((permission) => permission.id)
    .sort();
}

function sameIds(first, second) {
  return (
    first.length === second.length &&
    first.every((id, index) => id === second[index])
  );
}

export default function RolePermissionMatrix({
  role,
  open,
  onClose,
  canEdit = false,
}) {
  const notification = useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open || !role?.id) {
      return undefined;
    }

    let cancelled = false;

    async function loadMatrix() {
      setLoading(true);
      setLoadError("");
      setSearchInput("");
      setResourceFilter("all");

      try {
        const response = await roleService.getPermissionMatrix(role.id);

        if (cancelled) return;

        const normalized = normalizeMatrix(response).map(normalizePermission);

        setPermissions(normalized);
        setInitialAssignedIds(getAssignedIds(normalized));
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error));
          setPermissions([]);
          setInitialAssignedIds([]);
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
  }, [open, role?.id, reloadKey]);

  const resources = useMemo(() => {
    const uniqueResources = [
      ...new Set(permissions.map((permission) => permission.resource)),
    ];

    return uniqueResources.sort((a, b) => {
      if (a === "dashboard") return -1;
      if (b === "dashboard") return 1;

      return getPermissionResourceLabel(a).localeCompare(
        getPermissionResourceLabel(b),
      );
    });
  }, [permissions]);

  const filteredPermissions = useMemo(
    () => filterPermissions(permissions, searchInput, resourceFilter),
    [permissions, searchInput, resourceFilter],
  );

  const visibleGroups = useMemo(
    () => groupPermissions(filteredPermissions),
    [filteredPermissions],
  );

  const assignedCount = useMemo(
    () => permissions.filter((permission) => permission.assigned).length,
    [permissions],
  );

  const currentAssignedIds = useMemo(
    () => getAssignedIds(permissions),
    [permissions],
  );

  const isDirty = !sameIds(currentAssignedIds, initialAssignedIds);

  const handlePermissionChange = (permissionId, checked) => {
    if (!canEdit || saving) return;

    setPermissions((current) =>
      current.map((permission) =>
        permission.id === permissionId
          ? { ...permission, assigned: checked }
          : permission,
      ),
    );
  };

  const handleReset = () => {
    if (!canEdit || saving) return;

    const assigned = new Set(initialAssignedIds);

    setPermissions((current) =>
      current.map((permission) => ({
        ...permission,
        assigned: assigned.has(permission.id),
      })),
    );
  };

  const handleSave = async () => {
    if (!canEdit || !role?.id || saving || !isDirty) return;

    setSaving(true);

    try {
      const permissionIds = getAssignedIds(permissions);

      const response = await roleService.replacePermissions(
        role.id,
        permissionIds,
      );

      setInitialAssignedIds(permissionIds);

      notification.success(
        response?.message ?? "Role permissions updated successfully.",
      );
    } catch (error) {
      notification.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Card variant="outlined" sx={{ width: "100%", minWidth: 0 }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="h5" component="h2" fontWeight={800}>
                Permissions
              </Typography>

              <Typography color="text.secondary">
                Configure access for {role?.name ?? role?.code ?? "this role"}.
              </Typography>
            </Box>

            <Button variant="text" onClick={onClose} disabled={saving}>
              Close
            </Button>
          </Stack>

          {!loading && !loadError && permissions.length > 0 && (
            <Card
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned permissions
                  </Typography>

                  <Typography variant="h4" component="p" fontWeight={800}>
                    {assignedCount}
                    <Typography
                      component="span"
                      variant="body1"
                      color="text.secondary"
                    >
                      {" "}
                      / {permissions.length}
                    </Typography>
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {isDirty
                      ? "You have unsaved changes."
                      : "All changes are saved."}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          )}

          {!loading && !loadError && permissions.length > 0 && (
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Search permissions"
                placeholder="Search by name or permission code"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                slotProps={{
                  htmlInput: {
                    "aria-describedby": "permission-search-help",
                  },
                }}
              />

              <Typography
                id="permission-search-help"
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: "none", md: "none" } }}
              >
                Search by permission name, code, resource, or action.
              </Typography>

              <FormControl
                size="small"
                sx={{ minWidth: { xs: "100%", md: 220 } }}
              >
                <InputLabel id="permission-resource-filter-label">
                  Resource
                </InputLabel>

                <Select
                  labelId="permission-resource-filter-label"
                  id="permission-resource-filter"
                  value={resourceFilter}
                  label="Resource"
                  onChange={(event) => setResourceFilter(event.target.value)}
                >
                  <MenuItem value="all">All resources</MenuItem>

                  {resources.map((resource) => (
                    <MenuItem key={resource} value={resource}>
                      {getPermissionResourceLabel(resource)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {loading ? (
            <Box
              role="status"
              aria-live="polite"
              sx={{
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={26} />
              <Typography>Loading permissions…</Typography>
            </Box>
          ) : loadError ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  Reload
                </Button>
              }
            >
              {loadError}
            </Alert>
          ) : permissions.length === 0 ? (
            <Alert severity="info">
              No permissions were returned for this role.
            </Alert>
          ) : visibleGroups.length === 0 ? (
            <Alert severity="info">
              No permissions match the current search and resource filters.
            </Alert>
          ) : (
            <Grid container spacing={2} alignItems="stretch">
              {visibleGroups.map(([resource, resourcePermissions]) => (
                <Grid
                  key={resource}
                  size={{ xs: 12, sm: 6, lg: 4 }}
                  sx={{ display: "flex", minWidth: 0 }}
                >
                  <PermissionGroupCard
                    resource={resource}
                    permissions={resourcePermissions}
                    canEdit={canEdit}
                    saving={saving}
                    onPermissionChange={handlePermissionChange}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {canEdit && !loading && !loadError && permissions.length > 0 && (
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="flex-end"
              spacing={1}
              sx={{
                pt: 1,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<RestartAltOutlinedIcon />}
                onClick={handleReset}
                disabled={saving || !isDirty}
              >
                Reset changes
              </Button>

              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveOutlinedIcon />
                  )
                }
                onClick={handleSave}
                disabled={saving || !isDirty}
              >
                {saving ? "Saving…" : "Save permissions"}
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
