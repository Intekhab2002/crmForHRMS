import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

import { roleService } from "../services/role.service";

export default function RoleAssignedUsers({ role, open, onClose }) {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !role?.id) {
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await roleService.getUsers(role.id);

        if (!cancelled) {
          setUsers(
            Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [],
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.response?.data?.message ??
              "Unable to load assigned users.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, role?.id]);

  if (!open) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack>
              <Typography variant="h6" fontWeight={700}>
                Assigned Users
              </Typography>

              <Typography color="text.secondary">
                {role?.name ?? role?.code}
              </Typography>
            </Stack>

            <Chip
              label={`${users.length} users`}
              size="small"
              variant="outlined"
            />

            <Box>
              <Button variant="text" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Typography color="text.secondary">
              No users are assigned to this role.
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {users.map((user) => (
                <Stack
                  key={user.id}
                  direction="row"
                  justifyContent="space-between"
                  py={1.5}
                >
                  <Stack>
                    <Typography fontWeight={600}>{user.username}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Stack>

                  <Chip
                    size="small"
                    label={user.status ?? "unknown"}
                    variant="outlined"
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
