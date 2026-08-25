import { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import OptionChip from "../../../components/display/OptionChip";
import { useAuth } from "../../../context/useAuth";
import {
  formatDateTime,
  formatTicketValue,
  getField,
} from "../utils/ticketFormatters";

function canReadColumn(column, hasPermission) {
  return !column.permission || hasPermission(column.permission);
}

function renderColumnCell(column, field, fallback) {
  if (
    column.presentation === "statusChip" ||
    column.presentation === "priorityChip"
  ) {
    return (params) => (
      <OptionChip
        value={params.row[column.field]}
        options={field?.options ?? []}
        fallback={fallback}
      />
    );
  }

  if (column.presentation === "optionLabel") {
    return (params) => (
      <Typography variant="body2">
        {column.valueIsDisplay
          ? params.row[column.field] ?? fallback
          : formatTicketValue(
              field,
              params.row[column.field],
              fallback,
            )}
      </Typography>
    );
  }

  if (column.presentation === "dateTime") {
    return (params) => (
      <Typography variant="body2">
        {formatDateTime(
          params.row[column.field],
          fallback,
        )}
      </Typography>
    );
  }

  return undefined;
}
export default function TicketDataGrid({
  rows,
  fields,
  columns,
  pageSizeOptions,
  defaultPageSize,
  title,
  fallback = "Not available",
  loading = false,
  onOpenTicket,
}) {
  const { hasPermission } = useAuth();

  const gridColumns = useMemo(
    () =>
      columns
        .filter((column) => canReadColumn(column, hasPermission))
        .map((column) => {
          if (column.type === "actions") {
            return {
              ...column,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              getActions: (params) => [
                <GridActionsCellItem
                  key="open"
                  icon={<VisibilityOutlinedIcon />}
                  label={column.actionLabel}
                  onClick={() => onOpenTicket(params.row)}
                  showInMenu={false}
                />,
              ],
            };
          }

          const field = getField(fields, column.sourceField ?? column.field);

          return {
            ...column,
            renderCell: renderColumnCell(column, field, fallback),
          };
        }),
    [columns, fallback, fields, hasPermission, onOpenTicket],
  );

  return (
    <Paper variant="outlined" sx={{ height: 650, width: "100%" }}>
      <Box sx={{ height: "100%", width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={gridColumns}
          loading={loading}
          label={title}
          getRowId={(row) => row.id}
          pagination
          pageSizeOptions={pageSizeOptions}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: defaultPageSize,
              },
            },
          }}
          showToolbar
          disableRowSelectionOnClick
          ignoreDiacritics
          onRowDoubleClick={(params) => onOpenTicket(params.row)}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: {
                debounceMs: 300,
              },
            },
          }}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 800,
            },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
          }}
        />
      </Box>
    </Paper>
  );
}
