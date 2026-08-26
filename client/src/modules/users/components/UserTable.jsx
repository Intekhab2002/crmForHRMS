import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutline";

import { DataGrid } from "@mui/x-data-grid";

import {
  USER_COLUMNS,
  isDeveloper,
  isSuperAdmin,
} from "../users.config";

function formatUserName(row) {
  return (
    [row.first_name, row.last_name]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

function formatLastLogin(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function StatusChip({ status }) {
  const color =
    status === "active"
      ? "success"
      : status === "inactive"
        ? "default"
        : status === "suspended"
          ? "warning"
          : status === "locked"
            ? "error"
            : "info";

  return (
    <Chip
      size="small"
      label={status ?? "Unknown"}
      color={color}
      variant="outlined"
    />
  );
}

export default function UserTable({
  users,
  loading,
  pagination,
  paginationModel,
  onPaginationModelChange,
  onEdit,
  onStatusChange,
  onDelete,
  canUpdate = false,
  canDelete = false,
  currentUserIsDeveloper = false,
}) {
  const columns = [
    ...USER_COLUMNS.map((column) => {
      if (column.field === "name") {
        return {
          ...column,
          valueGetter: (_value, row) =>
            formatUserName(row),
        };
      }

      if (column.field === "role") {
        return {
          ...column,
          valueGetter: (_value, row) =>
            row.role?.name ??
            row.role?.code ??
            row.roles?.[0]?.name ??
            row.roles?.[0]?.code ??
            "—",
        };
      }

      if (column.field === "status") {
        return {
          ...column,
          renderCell: ({ value }) => (
            <StatusChip status={value} />
          ),
        };
      }

      if (column.field === "last_login_at") {
        return {
          ...column,
          renderCell: ({ value }) =>
            formatLastLogin(value),
        };
      }

      return column;
    }),

    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 150,

      renderCell: ({ row }) => {
        const developer =
          isDeveloper(row);

        const superAdmin =
          isSuperAdmin(row);

        /*
         * Developer is never an ordinary
         * user-management target.
         */
        if (developer) {
          return null;
        }

        /*
         * Super Admin may only be managed
         * by Developer.
         */
        const protectedSuperAdmin =
          superAdmin &&
          !currentUserIsDeveloper;

        if (protectedSuperAdmin) {
          return (
            <Tooltip title="Protected system administrator">
              <span>
                <Chip
                  size="small"
                  label="Protected"
                  variant="outlined"
                />
              </span>
            </Tooltip>
          );
        }

        return (
          <Box>
            {canUpdate ? (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() =>
                      onEdit(row)
                    }
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title={
                    row.status ===
                    "active"
                      ? "Deactivate"
                      : "Activate"
                  }
                >
                  <IconButton
                    size="small"
                    onClick={() =>
                      onStatusChange(row)
                    }
                  >
                    {row.status ===
                    "active" ? (
                      <BlockOutlinedIcon fontSize="small" />
                    ) : (
                      <CheckCircleOutlineOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </>
            ) : null}

            {canDelete ? (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    onDelete(row)
                  }
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        );
      },
    },
  ];

  const rows = users.map((user) => ({
    ...user,
    id: user.id,
  }));

  return (
    <DataGrid
      autoHeight
      rows={rows}
      columns={columns}
      loading={loading}
      disableRowSelectionOnClick

      pagination
      paginationMode="server"

      rowCount={
        pagination?.total ?? 0
      }

      paginationModel={
        paginationModel
      }

      onPaginationModelChange={
        onPaginationModelChange
      }

      pageSizeOptions={[
        20,
        50,
        100,
      ]}

      getRowId={(row) => row.id}

      slots={{
        noRowsOverlay: () => (
          <Box sx={{ p: 4 }}>
            No users found.
          </Box>
        ),
      }}
    />
  );
}