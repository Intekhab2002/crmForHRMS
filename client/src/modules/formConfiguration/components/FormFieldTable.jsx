import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { DataGrid } from "@mui/x-data-grid";

export default function FormFieldTable({
  rows,
  loading,
  canUpdate,
  canDelete,
  canRestore,
  canEnable,
  canDisable,
  onEdit,
  onDelete,
  onRestore,
  onEnable,
  onDisable,
  onToggleVisibility,
}) {
  const columns = [
    {
      field: "fieldKey",
      headerName: "Field Key",
      minWidth: 170,
      flex: 1,
    },
    {
      field: "label",
      headerName: "Label",
      minWidth: 160,
      flex: 1,
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
    },
    {
      field: "dataType",
      headerName: "Data Type",
      width: 130,
    },
    {
      field: "storageType",
      headerName: "Storage",
      width: 150,
    },
    {
      field: "isRequired",
      headerName: "Required",
      width: 100,
      renderCell: ({ value }) => (
        <Chip size="small" label={value ? "Yes" : "No"} color={value ? "primary" : "default"} />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={value === "active" ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "isVisible",
      headerName: "Visible",
      width: 100,
      renderCell: ({ value }) => (value ? "Yes" : "No"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.25}>
          {canUpdate ? (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(row)}>
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}

          {!row.isDeleted && canUpdate ? (
            <Tooltip title={row.isVisible ? "Hide" : "Show"}>
              <IconButton size="small" onClick={() => onToggleVisibility(row)}>
                {row.isVisible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </Tooltip>
          ) : null}

          {row.isDeleted && canRestore ? (
            <Tooltip title="Restore">
              <IconButton size="small" color="success" onClick={() => onRestore(row)}>
                <RestoreOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}

          {!row.isDeleted && row.isEnabled && canDisable ? (
            <Tooltip title="Disable">
              <IconButton size="small" onClick={() => onDisable(row)}>
                <ToggleOffOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}

          {!row.isDeleted && !row.isEnabled && canEnable ? (
            <Tooltip title="Enable">
              <IconButton size="small" color="success" onClick={() => onEnable(row)}>
                <ToggleOnOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}

          {!row.isDeleted && canDelete ? (
            <Tooltip title="Soft delete">
              <IconButton size="small" color="error" onClick={() => onDelete(row)}>
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
      autoHeight
      disableRowSelectionOnClick
      pageSizeOptions={[10, 20, 50]}
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
