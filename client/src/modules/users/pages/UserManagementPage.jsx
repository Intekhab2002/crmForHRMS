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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

import { useAuth } from "../../../context/useAuth";

import {
  isDeveloper,
  isSuperAdmin,
  getPrimaryRoleObject,
  getRoleOptions,
} from "../users.config";

import {
  SYSTEM_ROLE_CODES,
} from "../../../config/access.config";

import {
  PERMISSIONS,
} from "../../../config/permission.config";

import {
  userService,
} from "../services/user.service";

import {
  roleService,
} from "../../roles/services/role.service";

import UserFormDialog from "../components/UserFormDialog";
import UserTable from "../components/UserTable";

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
    error?.response?.data?.message ??
    error?.response?.data?.error
      ?.message ??
    error?.message ??
    "Unable to complete the request."
  );
}

export default function UserManagementPage() {
  const {
    user: currentUser,
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

  const canCreate =
    hasPermission(
      PERMISSIONS.USER_CREATE,
    );

  const canUpdate =
    hasPermission(
      PERMISSIONS.USER_UPDATE,
    );

  const canDelete =
    hasPermission(
      PERMISSIONS.USER_DELETE,
    );

  const [users, setUsers] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [rolesLoading, setRolesLoading] =
    useState(false);

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [roleCode, setRoleCode] =
    useState("");

  const [pagination, setPagination] =
    useState(EMPTY_PAGINATION);

  const [paginationModel, setPaginationModel] =
    useState({
      page: 0,
      pageSize: DEFAULT_PAGE_SIZE,
    });

  const roleOptions = useMemo(
    () =>
      getRoleOptions(
        roles,
        editingUser?.role?.code ??
          editingUser?.roles?.[0]?.code,
        currentUserIsDeveloper,
      ),
    [
      roles,
      editingUser,
      currentUserIsDeveloper,
    ],
  );

  const loadRoles = useCallback(
    async () => {
      if (!canCreate && !canUpdate) {
        setRoles([]);
        return;
      }

      setRolesLoading(true);

      try {
        const response =
          await roleService.list({
            page: 1,
            limit: 100,
            isActive: "true",
          });

        setRoles(
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [],
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
        );
      } finally {
        setRolesLoading(false);
      }
    },
    [canCreate, canUpdate],
  );

  const loadUsers = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await userService.list({
            page:
              paginationModel.page + 1,

            limit:
              paginationModel.pageSize,

            search,

            status: status || undefined,

            roleCode:
              roleCode || undefined,
          });

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [];

        /*
         * Developer must never be presented
         * as an ordinary user-management row.
         */
        const visibleUsers =
          data.filter(
            (user) =>
              !isDeveloper(user),
          );

        setUsers(
          visibleUsers.map(
            (user) => ({
              ...user,
              role:
                user.role ??
                getPrimaryRoleObject(
                  user,
                ),
            }),
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

        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [
      paginationModel,
      search,
      status,
      roleCode,
    ],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const handleSearch = () => {
    setPaginationModel(
      (current) => ({
        ...current,
        page: 0,
      }),
    );

    setSearch(
      searchInput.trim(),
    );
  };

  const handleSearchKeyDown = (
    event,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleStatusFilter = (
    event,
  ) => {
    setStatus(
      event.target.value,
    );

    setPaginationModel(
      (current) => ({
        ...current,
        page: 0,
      }),
    );
  };

  const handleRoleFilter = (
    event,
  ) => {
    setRoleCode(
      event.target.value,
    );

    setPaginationModel(
      (current) => ({
        ...current,
        page: 0,
      }),
    );
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setRoleCode("");

    setPaginationModel({
      page: 0,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (
    user,
  ) => {
    if (!canUpdate) {
      return;
    }

    if (isDeveloper(user)) {
      return;
    }

    if (
      isSuperAdmin(user) &&
      !currentUserIsDeveloper
    ) {
      return;
    }

    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSave = async (
    values,
  ) => {
    setError("");
    setSuccess("");

    try {
      if (editingUser) {
        await userService.update(
          editingUser.id,
          values,
        );

        setSuccess(
          "User updated successfully.",
        );
      } else {
        await userService.create(
          values,
        );

        setSuccess(
          "User created successfully.",
        );
      }

      setDialogOpen(false);
      setEditingUser(null);

      await loadUsers();
    } catch (requestError) {
      throw requestError;
    }
  };

  const handleStatusChange = async (
    user,
  ) => {
    if (!canUpdate) {
      return;
    }

    if (isDeveloper(user)) {
      return;
    }

    if (
      isSuperAdmin(user) &&
      !currentUserIsDeveloper
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const nextStatus =
        user.status === "active"
          ? "inactive"
          : "active";

      await userService.updateStatus(
        user.id,
        nextStatus,
      );

      setSuccess(
        `User ${nextStatus === "active" ? "activated" : "deactivated"} successfully.`,
      );

      await loadUsers();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    }
  };

  const handleDelete = async (
    user,
  ) => {
    if (!canDelete) {
      return;
    }

    if (isDeveloper(user)) {
      return;
    }

    if (
      isSuperAdmin(user) &&
      !currentUserIsDeveloper
    ) {
      return;
    }

    if (
      user.id === currentUser?.id
    ) {
      setError(
        "You cannot delete your own user account.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete user '${user.username}'?`,
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await userService.remove(
        user.id,
      );

      setSuccess(
        "User deleted successfully.",
      );

      await loadUsers();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    }
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(roleCode);

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
            User Management
          </Typography>

          <Typography color="text.secondary">
            Manage application users,
            status and role assignment.
          </Typography>
        </Stack>

        {canCreate ? (
          <Button
            variant="contained"
            startIcon={
              <AddOutlinedIcon />
            }
            onClick={
              handleOpenCreate
            }
            disabled={
              rolesLoading ||
              roleOptions.length === 0
            }
          >
            Create user
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
                label="Search users"
                placeholder="Username, email or name"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                onKeyDown={
                  handleSearchKeyDown
                }
              />

              <Button
                variant="outlined"
                onClick={
                  handleSearch
                }
              >
                Search
              </Button>

              <FormControl
                size="small"
                sx={{
                  minWidth: 160,
                }}
              >
                <InputLabel>
                  Status
                </InputLabel>

                <Select
                  label="Status"
                  value={status}
                  onChange={
                    handleStatusFilter
                  }
                >
                  <MenuItem value="">
                    All statuses
                  </MenuItem>

                  <MenuItem value="pending">
                    Pending
                  </MenuItem>

                  <MenuItem value="active">
                    Active
                  </MenuItem>

                  <MenuItem value="inactive">
                    Inactive
                  </MenuItem>

                  <MenuItem value="suspended">
                    Suspended
                  </MenuItem>

                  <MenuItem value="locked">
                    Locked
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: 180,
                }}
              >
                <InputLabel>
                  Role
                </InputLabel>

                <Select
                  label="Role"
                  value={roleCode}
                  onChange={
                    handleRoleFilter
                  }
                >
                  <MenuItem value="">
                    All roles
                  </MenuItem>

                  {roles
                    .filter(
                      (role) =>
                        role.code !==
                        SYSTEM_ROLE_CODES.DEVELOPER,
                    )
                    .map(
                      (role) => (
                        <MenuItem
                          key={
                            role.code
                          }
                          value={
                            role.code
                          }
                        >
                          {role.name ??
                            role.code}
                        </MenuItem>
                      ),
                    )}
                </Select>
              </FormControl>

              <Button
                variant="text"
                startIcon={
                  <RestartAltOutlinedIcon />
                }
                disabled={
                  !hasFilters &&
                  !searchInput
                }
                onClick={
                  handleResetFilters
                }
              >
                Reset
              </Button>
            </Stack>

            <UserTable
              users={users}
              loading={loading}
              pagination={
                pagination
              }
              paginationModel={
                paginationModel
              }
              onPaginationModelChange={(
                model,
              ) => {
                setPaginationModel(
                  model,
                );
              }}
              canUpdate={
                canUpdate
              }
              canDelete={
                canDelete
              }
              currentUserIsDeveloper={
                currentUserIsDeveloper
              }
              onEdit={
                handleOpenEdit
              }
              onStatusChange={
                handleStatusChange
              }
              onDelete={
                handleDelete
              }
            />
          </Stack>
        </CardContent>
      </Card>

      {canCreate ||
      canUpdate ? (
        <UserFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(
              false,
            );
            setEditingUser(
              null,
            );
          }}
          onSubmit={
            handleSave
          }
          roleOptions={
            roleOptions
          }
          user={
            editingUser
          }
          canEdit={
            editingUser
              ? canUpdate
              : canCreate
          }
        />
      ) : null}
    </Stack>
  );
}