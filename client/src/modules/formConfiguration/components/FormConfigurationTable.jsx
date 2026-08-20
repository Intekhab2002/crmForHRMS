import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import {
  DataGrid,
} from "@mui/x-data-grid";

export default function FormConfigurationTable({
  rows,
  loading,
  canCreate,
  canUpdate,
  canDelete,
  onCreate,
  onEdit,
  onDelete,
  onManageFields,
}) {
  const columns = [
    {
      field: "code",
      headerName: "Code",
      flex: 1.2,
      minWidth: 180,
    },

    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
    },

    {
      field: "module",
      headerName: "Module",
      flex: 0.7,
      minWidth: 120,
    },

    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({
        value,
      }) => (
        <Chip
          size="small"
          label={value}
          color={
            value === "active"
              ? "success"
              : "default"
          }
          variant="outlined"
        />
      ),
    },

    {
      field: "updatedAt",
      headerName: "Updated",
      width: 180,
      valueGetter: (
        _value,
        row,
      ) =>
        row.updatedAt
          ? new Date(
              row.updatedAt,
            ).toLocaleString()
          : "-",
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 190,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
        >
          Actions

          {canCreate ? (
            <Tooltip title="Create form">
              <IconButton
                size="small"
                onClick={onCreate}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      ),
      renderCell: ({
        row,
      }) => (
        <Box
          display="flex"
          gap={0.5}
        >
          <Tooltip title="Manage fields">
            <IconButton
              size="small"
              onClick={() =>
                onManageFields(row)
              }
            >
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>

          {canUpdate ? (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() =>
                  onEdit(row)
                }
              >
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
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
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      disableRowSelectionOnClick
      autoHeight
      pageSizeOptions={[
        10,
        20,
        50,
      ]}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 20,
            page: 0,
          },
        },
      }}
    />
  );
}