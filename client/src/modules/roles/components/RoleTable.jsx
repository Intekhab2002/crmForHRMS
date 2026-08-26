import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutline";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

import { DataGrid } from "@mui/x-data-grid";

import {
  canManageRole,
  isDeveloperRole,
  isSuperAdminRole,
} from "../roles.config";

function StatusChip({
  active,
}) {
  return (
    <Chip
      size="small"
      label={
        active
          ? "Active"
          : "Inactive"
      }
      color={
        active
          ? "success"
          : "default"
      }
      variant="outlined"
    />
  );
}

export default function RoleTable({
  roles,
  loading,
  pagination,
  paginationModel,
  onPaginationModelChange,
  onEdit,
  onDelete,
  onPermissions,
  onUsers,
  canUpdate = false,
  canDelete = false,
  currentUserIsDeveloper = false,
}) {
  const columns = [
    {
      field: "name",
      headerName: "Role",
      flex: 1,
      minWidth: 180,
    },

    {
      field: "code",
      headerName: "Code",
      flex: 0.9,
      minWidth: 160,
    },

    {
      field: "description",
      headerName: "Description",
      flex: 1.5,
      minWidth: 220,
    },

    {
      field: "is_system",
      headerName: "Type",
      width: 120,

      renderCell: ({
        value,
      }) => (
        <Chip
          size="small"
          label={
            value
              ? "System"
              : "Custom"
          }
          variant="outlined"
        />
      ),
    },

    {
      field: "is_active",
      headerName: "Status",
      width: 120,

      renderCell: ({
        value,
      }) => (
        <StatusChip
          active={value}
        />
      ),
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,

      renderCell: ({
        row,
      }) => {
        const developer =
          isDeveloperRole(row);

        const superAdmin =
          isSuperAdminRole(row);

        /*
         * Developer is never exposed
         * as an ordinary role.
         */
        if (developer) {
          return null;
        }

        const manageable =
          canManageRole(
            row,
            currentUserIsDeveloper,
          );

        return (
          <Box>
            {manageable &&
            canUpdate ? (
              <Tooltip title="Edit role">
                <IconButton
                  size="small"
                  onClick={() =>
                    onEdit(row)
                  }
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}

            {manageable &&
            canUpdate ? (
              <Tooltip title="Permissions">
                <IconButton
                  size="small"
                  onClick={() =>
                    onPermissions(row)
                  }
                >
                  <SecurityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}

            <Tooltip title="Assigned users">
              <IconButton
                size="small"
                onClick={() =>
                  onUsers(row)
                }
              >
                <PeopleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {manageable &&
            canDelete ? (
              <Tooltip title="Delete role">
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

            {superAdmin &&
            !currentUserIsDeveloper ? (
              <Chip
                size="small"
                label="Protected"
                variant="outlined"
              />
            ) : null}
          </Box>
        );
      },
    },
  ];

  return (
    <DataGrid
      autoHeight
      rows={roles}
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
      getRowId={(row) =>
        row.id
      }
      slots={{
        noRowsOverlay: () => (
          <Box sx={{ p: 4 }}>
            No roles found.
          </Box>
        ),
      }}
    />
  );
}