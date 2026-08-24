import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { DataGrid } from "@mui/x-data-grid";

function renderOverride(value) {
  if (value === null || value === undefined) {
    return (
      <Chip
        size="small"
        label="Inherited"
        variant="outlined"
      />
    );
  }

  return (
    <Chip
      size="small"
      label={value ? "Yes" : "No"}
      color={value ? "success" : "default"}
      variant="outlined"
    />
  );
}

function renderBoolean(value) {
  return (
    <Chip
      size="small"
      label={value ? "Yes" : "No"}
      color={value ? "success" : "default"}
      variant="outlined"
    />
  );
}

export default function FormAssignedFieldsTable({
  rows,
  loading = false,
  canUpdate = false,
  onEdit,
  onRemove,
}) {
  const columns = [
    {
      field: "displayOrder",
      headerName: "Order",
      width: 80,
      type: "number",
    },

    {
      field: "fieldKey",
      headerName: "Field",
      flex: 1,
      minWidth: 180,
    },

    {
      field: "section",
      headerName: "Section",
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_value, row) =>
        row.section || "-",
    },

    {
      field: "gridSize",
      headerName: "Grid",
      width: 80,
      valueGetter: (_value, row) =>
        row.gridSize ?? "-",
    },

    {
      field: "columnWidth",
      headerName: "Width",
      width: 100,
      valueGetter: (_value, row) =>
        row.columnWidth || "-",
    },

    {
      field: "isVisible",
      headerName: "Visible",
      width: 105,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isEnabled",
      headerName: "Enabled",
      width: 105,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isEditable",
      headerName: "Editable",
      width: 105,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isReadOnly",
      headerName: "Read Only",
      width: 105,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isRequired",
      headerName: "Required",
      width: 105,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isSearchable",
      headerName: "Search",
      width: 100,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isFilterable",
      headerName: "Filter",
      width: 100,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "isSortable",
      headerName: "Sort",
      width: 100,
      renderCell: ({ value }) =>
        renderOverride(value),
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={0.5}
        >
          {canUpdate ? (
            <Tooltip title="Edit assignment">
              <IconButton
                size="small"
                onClick={() =>
                  onEdit?.(row)
                }
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}

          {canUpdate ? (
            <Tooltip title="Remove field">
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  onRemove?.(row)
                }
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
    },
  ];

  if (!loading && rows.length === 0) {
    return (
      <Box
        sx={{
          py: 5,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body1"
          fontWeight={600}
        >
          No fields assigned
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mt={0.5}
        >
          Add fields to configure this form.
        </Typography>
      </Box>
    );
  }

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      disableRowSelectionOnClick
      autoHeight
      hideFooterSelectedRowCount
      getRowId={(row) => row.id}
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

        sorting: {
          sortModel: [
            {
              field: "displayOrder",
              sort: "asc",
            },
          ],
        },
      }}
    />
  );
}