import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

import { useAuth } from "../../../context/useAuth";

import {
  PERMISSIONS,
} from "../../../config/permission.config";

import {
  SYSTEM_ROLE_CODES,
} from "../../../config/access.config";

import {
  roleService,
} from "../services/role.service";

import {
  isDeveloperRole,
  isSuperAdminRole,
  canManageRole,
} from "../roles.config";

import RoleTable from "../components/RoleTable";
import RoleFormDialog from "../components/RoleFormDialog";
import RolePermissionMatrix from "../components/RolePermissionMatrix";
import RoleAssignedUsers from "../components/RoleAssignedUsers";

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_PAGINATION =
  Object.freeze({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

function getErrorMessage(error) {
  return (
    error?.response?.data
      ?.message ??
    error?.response?.data
      ?.error?.message ??
    error?.message ??
    "Unable to complete the request."
  );
}

export default function RoleManagementPage() {
  const {
    roles: currentRoles,
    hasPermission,
  } = useAuth();

  const currentUserIsDeveloper =
    currentRoles?.some(
      (role) =>
        (
          typeof role === "string"
            ? role
            : role?.code
        ) ===
        SYSTEM_ROLE_CODES.DEVELOPER,
    ) ?? false;

  const canRead =
    hasPermission(
      PERMISSIONS.ROLE_READ,
    );

  const canCreate =
    hasPermission(
      PERMISSIONS.ROLE_CREATE,
    );

  const canUpdate =
    hasPermission(
      PERMISSIONS.ROLE_UPDATE,
    );

  const canDelete =
    hasPermission(
      PERMISSIONS.ROLE_DELETE,
    );

  const [
    roles,
    setRoles,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    pagination,
    setPagination,
  ] = useState(
    EMPTY_PAGINATION,
  );

  const [
    paginationModel,
    setPaginationModel,
  ] = useState({
    page: 0,
    pageSize:
      DEFAULT_PAGE_SIZE,
  });

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingRole,
    setEditingRole,
  ] = useState(null);

  const [
    matrixRole,
    setMatrixRole,
  ] = useState(null);

  const [
    usersRole,
    setUsersRole,
  ] = useState(null);

  const loadRoles =
    useCallback(
      async () => {
        if (!canRead) {
          setRoles([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
          const response =
            await roleService.list({
              page:
                paginationModel.page +
                1,

              limit:
                paginationModel.pageSize,

              search:
                search || undefined,

              /*
               * Developer must never appear
               * in the normal role-management UI.
               */
              isSystem:
                undefined,
            });

          const data =
            Array.isArray(
              response?.data,
            )
              ? response.data
              : [];

          setRoles(
            data.filter(
              (role) =>
                !isDeveloperRole(
                  role,
                ),
            ),
          );

          setPagination(
            response?.pagination ??
              EMPTY_PAGINATION,
          );
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
            ),
          );

          setRoles([]);
        } finally {
          setLoading(false);
        }
      },
      [
        canRead,
        paginationModel,
        search,
      ],
    );

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const handleSearch =
    () => {
      setSearch(
        searchInput.trim(),
      );

      setPaginationModel(
        (current) => ({
          ...current,
          page: 0,
        }),
      );
    };

  const handleReset =
    () => {
      setSearchInput("");
      setSearch("");

      setPaginationModel({
        page: 0,
        pageSize:
          DEFAULT_PAGE_SIZE,
      });
    };

  const handleCreate =
    () => {
      if (!canCreate) {
        return;
      }

      setEditingRole(null);
      setFormOpen(true);
    };

  const handleEdit =
    (role) => {
      if (!canUpdate) {
        return;
      }

      if (
        !canManageRole(
          role,
          currentUserIsDeveloper,
        )
      ) {
        return;
      }

      setEditingRole(role);
      setFormOpen(true);
    };

  const handleSave =
    async (payload) => {
      setError("");
      setSuccess("");

      if (editingRole) {
        await roleService.update(
          editingRole.id,
          payload,
        );

        setSuccess(
          "Role updated successfully.",
        );
      } else {
        await roleService.create(
          payload,
        );

        setSuccess(
          "Role created successfully.",
        );
      }

      setFormOpen(false);
      setEditingRole(null);

      await loadRoles();
    };

  const handleDelete =
    async (role) => {
      if (!canDelete) {
        return;
      }

      if (
        !canManageRole(
          role,
          currentUserIsDeveloper,
        )
      ) {
        return;
      }

      if (
        isDeveloperRole(role)
      ) {
        return;
      }

      if (
        isSuperAdminRole(
          role,
        ) &&
        !currentUserIsDeveloper
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete role '${role.name}'? If users are assigned to this role, deletion may be rejected by the server.`,
        );

      if (!confirmed) {
        return;
      }

      setError("");
      setSuccess("");

      try {
        await roleService.remove(
          role.id,
        );

        setSuccess(
          "Role deleted successfully.",
        );

        await loadRoles();
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
        );
      }
    };

  const handlePermissions =
    (role) => {
      if (!canUpdate) {
        return;
      }

      if (
        !canManageRole(
          role,
          currentUserIsDeveloper,
        )
      ) {
        return;
      }

      setMatrixRole(role);
      setUsersRole(null);
    };

  const handleUsers =
    (role) => {
      setUsersRole(role);
      setMatrixRole(null);
    };

  const hasSearch =
    Boolean(search);

  const pageTitle =
    useMemo(
      () =>
        matrixRole
          ? `Permissions — ${matrixRole.name}`
          : usersRole
            ? `Assigned Users — ${usersRole.name}`
            : "Role Management",
      [
        matrixRole,
        usersRole,
      ],
    );

  return (
    <Stack spacing={3}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          sm: "center",
        }}
        spacing={2}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            {pageTitle}
          </Typography>

          <Typography
            color="text.secondary"
          >
            Manage roles,
            permissions and
            assigned users.
          </Typography>
        </Stack>

        {!matrixRole &&
        !usersRole &&
        canCreate ? (
          <Button
            variant="contained"
            startIcon={
              <AddOutlinedIcon />
            }
            onClick={
              handleCreate
            }
          >
            Create role
          </Button>
        ) : null}
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

      {matrixRole ? (
        <RolePermissionMatrix
          role={matrixRole}
          open
          onClose={() =>
            setMatrixRole(null)
          }
          canEdit={
            canUpdate &&
            canManageRole(
              matrixRole,
              currentUserIsDeveloper,
            )
          }
        />
      ) : usersRole ? (
        <RoleAssignedUsers
          role={usersRole}
          open
          onClose={() =>
            setUsersRole(null)
          }
        />
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={1.5}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Search roles"
                  placeholder="Role name or code"
                  value={
                    searchInput
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                />

                <Button
                  variant="outlined"
                  onClick={
                    handleSearch
                  }
                >
                  Search
                </Button>

                <Button
                  variant="text"
                  startIcon={
                    <RestartAltOutlinedIcon />
                  }
                  disabled={
                    !hasSearch &&
                    !searchInput
                  }
                  onClick={
                    handleReset
                  }
                >
                  Reset
                </Button>
              </Stack>

              <RoleTable
                roles={roles}
                loading={loading}
                pagination={
                  pagination
                }
                paginationModel={
                  paginationModel
                }
                onPaginationModelChange={
                  setPaginationModel
                }
                onEdit={
                  handleEdit
                }
                onDelete={
                  handleDelete
                }
                onPermissions={
                  handlePermissions
                }
                onUsers={
                  handleUsers
                }
                canUpdate={
                  canUpdate
                }
                canDelete={
                  canDelete
                }
                currentUserIsDeveloper={
                  currentUserIsDeveloper
                }
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      <RoleFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRole(null);
        }}
        onSubmit={
          handleSave
        }
        role={
          editingRole
        }
        canEdit={
          editingRole
            ? canUpdate &&
              canManageRole(
                editingRole,
                currentUserIsDeveloper,
              )
            : canCreate
        }
      />
    </Stack>
  );
}