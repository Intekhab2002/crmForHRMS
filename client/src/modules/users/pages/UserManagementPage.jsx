import { useCallback, useEffect, useMemo, useState } from "react";

import {
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

import { SYSTEM_ROLE_CODES } from "../../../config/access.config";

import { PERMISSIONS } from "../../../config/permission.config";

import { userService } from "../services/user.service";

import { roleService } from "../../roles/services/role.service";

import UserFormDialog from "../components/UserFormDialog";
import UserTable from "../components/UserTable";
import { useNotification } from "../../../components/feedback/useNotification";
import ConfirmationDialog from "../../../components/feedback/ConfirmationDialog";

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
});

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error?.message ??
    error?.message ??
    "Unable to complete the request."
  );
}

async function fetchUsers({ paginationModel, search, status, roleCode }) {
  const response = await userService.list({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    search,
    status: status || undefined,
    roleCode: roleCode || undefined,
  });

  const data = Array.isArray(response?.data) ? response.data : [];

  // Developer accounts must not appear as ordinary user-management rows.
  const visibleUsers = data.filter((user) => !isDeveloper(user));

  return {
    users: visibleUsers.map((user) => ({
      ...user,
      role: user.role ?? getPrimaryRoleObject(user),
    })),
    pagination: response?.pagination ?? EMPTY_PAGINATION,
  };
}

async function fetchRoles() {
  const response = await roleService.list({
    page: 1,
    limit: 100,
    isActive: "true",
  });

  return Array.isArray(response?.data) ? response.data : [];
}

export default function UserManagementPage() {
  const { user: currentUser, roles: currentRoles, hasPermission } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [userToBlock, setUserToBlock] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserIsDeveloper =
    currentRoles?.some(
      (role) =>
        (typeof role === "string" ? role : role?.code) ===
        SYSTEM_ROLE_CODES.DEVELOPER,
    ) ?? false;

  const canCreate = hasPermission(PERMISSIONS.USER_CREATE);

  const canUpdate = hasPermission(PERMISSIONS.USER_UPDATE);

  const canDelete = hasPermission(PERMISSIONS.USER_DELETE);

  const [users, setUsers] = useState([]);

  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [rolesLoading, setRolesLoading] = useState(canCreate || canUpdate);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [roleCode, setRoleCode] = useState("");

  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const roleOptions = useMemo(
    () =>
      getRoleOptions(
        roles,
        editingUser?.role?.code ?? editingUser?.roles?.[0]?.code,
        currentUserIsDeveloper,
      ),
    [roles, editingUser, currentUserIsDeveloper],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetchUsers({
        paginationModel,
        search,
        status,
        roleCode,
      });

      setUsers(result.users);
      setPagination(result.pagination);
    } catch (requestError) {
      notifyError(getErrorMessage(requestError));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, status, roleCode, notifyError]);

  useEffect(() => {
    let active = true;

    const loadInitialUsers = async () => {
      try {
        const result = await fetchUsers({
          paginationModel,
          search,
          status,
          roleCode,
        });

        if (!active) return;

        setUsers(result.users);
        setPagination(result.pagination);
      } catch (requestError) {
        if (!active) return;

        notifyError(getErrorMessage(requestError));
        setUsers([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInitialUsers();

    return () => {
      active = false;
    };
  }, [paginationModel, search, status, roleCode, notifyError]);

  useEffect(() => {
    if (!canCreate && !canUpdate) {
      return undefined;
    }

    let active = true;

    const loadInitialRoles = async () => {
      try {
        const result = await fetchRoles();

        if (!active) return;

        setRoles(result);
      } catch (requestError) {
        if (!active) return;

        notifyError(getErrorMessage(requestError));
      } finally {
        if (active) {
          setRolesLoading(false);
        }
      }
    };

    void loadInitialRoles();

    return () => {
      active = false;
    };
  }, [canCreate, canUpdate, notifyError]);

  const handleSearch = () => {
    setLoading(true);
    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));

    setSearch(searchInput.trim());
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleStatusFilter = (event) => {
    setLoading(true);
    setStatus(event.target.value);

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));
  };

  const handleRoleFilter = (event) => {
    setLoading(true);
    setRoleCode(event.target.value);

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));
  };

  const handleResetFilters = () => {
    setLoading(true);
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

  const handleOpenEdit = (user) => {
    if (!canUpdate) {
      return;
    }

    if (isDeveloper(user)) {
      return;
    }

    if (isSuperAdmin(user) && !currentUserIsDeveloper) {
      return;
    }

    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSave = async (values) => {
    if (editingUser) {
      await userService.update(editingUser.id, values);
      notifySuccess("User updated successfully.");
    } else {
      await userService.create(values);
      notifySuccess("User created successfully.");
    }

    setDialogOpen(false);
    setEditingUser(null);

    await loadUsers();
  };

  const applyStatusChange = async (user, nextStatus) => {
    if (!canUpdate || blocking) {
      return;
    }

    if (isDeveloper(user)) {
      return;
    }

    if (isSuperAdmin(user) && !currentUserIsDeveloper) {
      return;
    }

    if (user.id === currentUser?.id && nextStatus !== "active") {
      notifyError("You cannot block your own user account.");
      return;
    }

    setBlocking(true);

    try {
      await userService.updateStatus(user.id, nextStatus);

      notifySuccess(
        nextStatus === "inactive"
          ? "User blocked successfully."
          : "User activated successfully.",
      );

      setUserToBlock(null);
      await loadUsers();
    } catch (requestError) {
      notifyError(getErrorMessage(requestError));
    } finally {
      setBlocking(false);
    }
  };

  const handleStatusChange = (user) => {
    if (!canUpdate || isDeveloper(user)) {
      return;
    }

    if (isSuperAdmin(user) && !currentUserIsDeveloper) {
      return;
    }

    if (user.status === "active") {
      // Blocking is destructive to access, so ask for confirmation.
      setUserToBlock(user);
      return;
    }

    // Reactivating is not a blocking action; proceed directly.
    void applyStatusChange(user, "active");
  };

  const handleConfirmBlock = async () => {
    if (!userToBlock || blocking) {
      return;
    }

    await applyStatusChange(userToBlock, "inactive");
  };

  const handleDelete = (user) => {
    if (!canDelete || isDeveloper(user)) {
      return;
    }

    if (isSuperAdmin(user) && !currentUserIsDeveloper) {
      return;
    }

    if (user.id === currentUser?.id) {
      notifyError("You cannot delete your own user account.");
      return;
    }

    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await userService.remove(userToDelete.id);

      notifySuccess("User deleted successfully.");
      setUserToDelete(null);

      await loadUsers();
    } catch (requestError) {
      notifyError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(search) || Boolean(status) || Boolean(roleCode);

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
          <Typography variant="h4" fontWeight={800}>
            User Management
          </Typography>

          <Typography color="text.secondary">
            Manage application users, status and role assignment.
          </Typography>
        </Stack>

        {canCreate ? (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={handleOpenCreate}
            disabled={rolesLoading || roleOptions.length === 0}
          >
            Create user
          </Button>
        ) : null}
      </Stack>

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
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
              />

              <Button variant="outlined" onClick={handleSearch}>
                Search
              </Button>

              <FormControl
                size="small"
                sx={{
                  minWidth: 160,
                }}
              >
                <InputLabel>Status</InputLabel>

                <Select
                  label="Status"
                  value={status}
                  onChange={handleStatusFilter}
                >
                  <MenuItem value="">All statuses</MenuItem>

                  <MenuItem value="pending">Pending</MenuItem>

                  <MenuItem value="active">Active</MenuItem>

                  <MenuItem value="inactive">Inactive</MenuItem>

                  <MenuItem value="suspended">Suspended</MenuItem>

                  <MenuItem value="locked">Locked</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: 180,
                }}
              >
                <InputLabel>Role</InputLabel>

                <Select
                  label="Role"
                  value={roleCode}
                  onChange={handleRoleFilter}
                >
                  <MenuItem value="">All roles</MenuItem>

                  {roles
                    .filter((role) => role.code !== SYSTEM_ROLE_CODES.DEVELOPER)
                    .map((role) => (
                      <MenuItem key={role.code} value={role.code}>
                        {role.name ?? role.code}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Button
                variant="text"
                startIcon={<RestartAltOutlinedIcon />}
                disabled={!hasFilters && !searchInput}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Stack>

            <UserTable
              users={users}
              loading={loading}
              pagination={pagination}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) => {
                setLoading(true);
                setPaginationModel(model);
              }}
              canUpdate={canUpdate}
              canDelete={canDelete}
              currentUserIsDeveloper={currentUserIsDeveloper}
              onEdit={handleOpenEdit}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </Stack>
        </CardContent>
      </Card>

      {canCreate || canUpdate ? (
        <UserFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSave}
          roleOptions={roleOptions}
          user={editingUser}
          canEdit={editingUser ? canUpdate : canCreate}
        />
      ) : null}

      <ConfirmationDialog
        open={Boolean(userToBlock)}
        title="Block User"
        message={
          userToBlock
            ? `Block "${userToBlock.username}"? This will prevent the user from accessing the application. The account and its ticket history will be retained.`
            : "Block this user?"
        }
        confirmLabel="Block User"
        confirmColor="warning"
        loading={blocking}
        onCancel={() => {
          if (!blocking) {
            setUserToBlock(null);
          }
        }}
        onConfirm={handleConfirmBlock}
      />

      <ConfirmationDialog
        open={Boolean(userToDelete)}
        title="Delete User"
        message={
          userToDelete
            ? `Permanently delete "${userToDelete.username}"? This action cannot be undone. If tickets or other records reference this user, deletion will be rejected and an explanation will be shown.`
            : "Permanently delete this user?"
        }
        confirmLabel="Delete User"
        confirmColor="error"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setUserToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  );
}
