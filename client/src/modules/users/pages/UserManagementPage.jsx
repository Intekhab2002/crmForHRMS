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
  Typography,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import { useAuth } from "../../../context/useAuth";

import { PERMISSIONS } from "../../../config/permission.config";

import {
  getPrimaryRoleObject,
  getRoleOptions,
} from "../users.config";

import { userService } from "../services/user.service";
import { roleService } from "../../roles/services/role.service";

import UserFormDialog from "../components/UserFormDialog";
import UserTable from "../components/UserTable";

export default function UserManagementPage() {
  const {
    hasPermission,
  } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreate = hasPermission(
    PERMISSIONS.USER_CREATE,
  );

  const canUpdate = hasPermission(
    PERMISSIONS.USER_UPDATE,
  );

  const canDelete = hasPermission(
    PERMISSIONS.USER_DELETE,
  );

  const roleOptions = useMemo(
    () =>
      getRoleOptions(
        roles,
        editingUser?.role?.code,
      ),
    [
      roles,
      editingUser,
    ],
  );

  const loadRoles = useCallback(async () => {
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
        Array.isArray(response?.data)
          ? response.data
          : [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          "Unable to load roles.",
      );
    } finally {
      setRolesLoading(false);
    }
  }, [canCreate, canUpdate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const response =
        await userService.list({
          page: 1,
          limit: 100,
        });

      const data = Array.isArray(
        response?.data,
      )
        ? response.data
        : [];

      setUsers(
        data.map((user) => ({
          ...user,
          role:
            user.role ??
            getPrimaryRoleObject(user),
        })),
      );

      setError("");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const handleSave = async (values) => {
    setError("");
    setSuccess("");

    if (editingUser) {
      const payload = {
        ...values,
      };

      delete payload.password;

      await userService.update(
        editingUser.id,
        payload,
      );

      setSuccess(
        "User updated successfully.",
      );
    } else {
      await userService.create(values);

      setSuccess(
        "User created successfully.",
      );
    }

    await loadUsers();
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleStatusChange = async (user) => {
    setError("");

    try {
      await userService.updateStatus(
        user.id,
        user.status === "active"
          ? "inactive"
          : "active",
      );

      setSuccess(
        "User status updated successfully.",
      );

      await loadUsers();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          "Unable to update user status.",
      );
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Delete user '${user.username}'?`,
      )
    ) {
      return;
    }

    setError("");

    try {
      await userService.remove(user.id);

      setSuccess(
        "User deleted successfully.",
      );

      await loadUsers();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          "Unable to delete user.",
      );
    }
  };

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
            Manage application users
            and their roles.
          </Typography>
        </Stack>

        {canCreate ? (
          <Button
            variant="contained"
            startIcon={
              <AddOutlinedIcon />
            }
            onClick={() => {
              setEditingUser(null);
              setDialogOpen(true);
            }}
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
        <Alert severity="error">
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert severity="success">
          {success}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <UserTable
            users={users}
            loading={loading}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={(user) => {
              setEditingUser(user);
              setDialogOpen(true);
            }}
            onStatusChange={
              handleStatusChange
            }
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSave}
        roleOptions={roleOptions}
        user={editingUser}
      />
    </Stack>
  );
}