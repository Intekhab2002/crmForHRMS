import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { DataGrid } from "@mui/x-data-grid";

import { USER_COLUMNS } from "../users.config";

export default function UserTable({
  users,
  loading,
  onEdit,
  onStatusChange,
  onDelete,
  canUpdate = false,
  canDelete = false,
}) {
  const columns = [
    ...USER_COLUMNS.map((column) =>
      column.field === "role"
        ? {
            ...column,

            valueGetter: (_value, row) =>
              row.role?.name ??
              row.role?.code ??
              "—",
          }
        : column,
    ),

    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 150,

      renderCell: ({ row }) => (
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
                  row.status === "active"
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
                  {row.status === "active" ? (
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
      ),
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
      pageSizeOptions={[20, 50, 100]}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 20,
            page: 0,
          },
        },
      }}
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