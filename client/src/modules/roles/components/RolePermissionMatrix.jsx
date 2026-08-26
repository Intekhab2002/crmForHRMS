import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
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

function normalizeMatrix(
  response,
) {
  return (
    response?.data ??
    response ??
    []
  );
}

function normalizePermission(
  permission,
) {
  return {
    id: permission.id,
    code:
      permission.code ??
      "",
    name:
      permission.name ??
      permission.code ??
      "",
    module:
      permission.module ??
      permission.code?.split(":")[0] ??
      "Other",
    action:
      permission.action ??
      permission.code?.split(":")[1] ??
      "",
    assigned:
      Boolean(
        permission.assigned ??
        permission.isAssigned ??
        permission.enabled,
      ),
  };
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
      return;
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
            normalizeMatrix(
              response,
            ).map(
              normalizePermission,
            ),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.response
              ?.data?.message ??
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
  }, [
    open,
    role?.id,
  ]);

  const modules =
    useMemo(() => {
      const grouped =
        new Map();

      permissions.forEach(
        (permission) => {
          if (
            !grouped.has(
              permission.module,
            )
          ) {
            grouped.set(
              permission.module,
              [],
            );
          }

          grouped
            .get(
              permission.module,
            )
            .push(permission);
        },
      );

      return [...grouped.entries()];
    }, [permissions]);

  const togglePermission = (
    permissionId,
  ) => {
    if (!canEdit) {
      return;
    }

    setPermissions(
      (current) =>
        current.map(
          (permission) =>
            permission.id ===
            permissionId
              ? {
                  ...permission,
                  assigned:
                    !permission.assigned,
                }
              : permission,
        ),
    );
  };

  const handleSave = async () => {
    if (
      !canEdit ||
      !role?.id
    ) {
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

      await roleService.replacePermissions(
        role.id,
        permissionIds,
      );

      setSuccess(
        "Role permissions updated successfully.",
      );
    } catch (requestError) {
      setError(
        requestError?.response
          ?.data?.message ??
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
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Permission Matrix
              </Typography>

              <Typography
                color="text.secondary"
              >
                {role?.name ??
                  role?.code}
              </Typography>
            </Stack>

            <Button
              variant="text"
              onClick={onClose}
            >
              Close
            </Button>
          </Stack>

          {error ? (
            <Alert severity="error">
              {error}
            </Alert>
          ) : null}

          {success ? (
            <Alert severity="success">
              {success}
            </Alert>
          ) : null}

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              py={4}
            >
              <CircularProgress />
            </Box>
          ) : (
            modules.map(
              ([
                moduleName,
                modulePermissions,
              ]) => (
                <Box
                  key={moduleName}
                >
                  <Typography
                    fontWeight={700}
                    mb={1}
                    textTransform="capitalize"
                  >
                    {moduleName}
                  </Typography>

                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    flexWrap="wrap"
                    gap={1}
                  >
                    {modulePermissions.map(
                      (
                        permission,
                      ) => (
                        <FormControlLabel
                          key={
                            permission.id
                          }
                          control={
                            <Checkbox
                              checked={
                                permission.assigned
                              }
                              onChange={() =>
                                togglePermission(
                                  permission.id,
                                )
                              }
                              disabled={
                                !canEdit ||
                                saving
                              }
                            />
                          }
                          label={
                            permission.name
                          }
                        />
                      ),
                    )}
                  </Stack>
                </Box>
              ),
            )
          )}

          {canEdit ? (
            <Stack
              direction="row"
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                startIcon={
                  <SaveOutlinedIcon />
                }
                onClick={
                  handleSave
                }
                disabled={
                  loading ||
                  saving
                }
              >
                Save permissions
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}