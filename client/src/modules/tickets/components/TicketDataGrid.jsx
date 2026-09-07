import { useMemo } from "react";
import { Paper } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { GridActionsCellItem } from "@mui/x-data-grid";

import { AppDataGrid } from "../../../components/data-grid";
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
      <span>
        {column.valueIsDisplay
          ? (params.row[column.field] ?? fallback)
          : formatTicketValue(
              field,
              params.row[column.field],
              fallback,
              params.row,
            )}
      </span>
    );
  }

  if (column.presentation === "dateTime") {
    return (params) => (
      <span>{formatDateTime(params.row[column.field], fallback)}</span>
    );
  }

  return undefined;
}

export default function TicketDataGrid({
  rows,
  rowCount = 0,
  paginationModel,
  onPaginationModelChange,
  paginationMode = "client",
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
    <Paper
      variant="outlined"
      sx={{
        width: "100%",
        overflow: "hidden",
      }}
    >
      <AppDataGrid
        rows={rows}
        columns={gridColumns}
        loading={loading}
        getRowId={(row) => row.id}
        paginationMode={paginationMode}
        rowCount={paginationMode === "server" ? rowCount : undefined}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
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
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: {
              debounceMs: 300,
            },
          },
        }}
        aria-label={title}
      />
    </Paper>
  );
}
