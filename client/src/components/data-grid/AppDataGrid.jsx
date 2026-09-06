import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

function DefaultNoRowsOverlay() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        px: 2,
        color: "text.secondary",
        typography: "body2",
      }}
    >
      No records found.
    </Box>
  );
}

const DEFAULT_GRID_SX = {
  width: "100%",
  height: "100%",
  border: 0,

  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 800,
  },

  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none",
  },

  "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
    {
      outline: "none",
    },

  "& .MuiDataGrid-cell": {
    display: "flex",
    alignItems: "center",
  },

  "& .MuiDataGrid-columnHeader": {
    display: "flex",
    alignItems: "center",
  },
};

/**
 * Shared application DataGrid.
 *
 * Owns common DataGrid infrastructure:
 * - sizing
 * - density defaults
 * - pagination defaults
 * - selection behavior
 * - loading
 * - empty state
 * - common styling
 *
 * Domain-specific behavior must remain in module adapters.
 */
export default function AppDataGrid({
  rows = [],
  columns = [],
  loading = false,

  getRowId = (row) => row.id,

  pagination = true,
  paginationMode = "client",
  rowCount,

  paginationModel,
  onPaginationModelChange,

  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  initialState,

  showToolbar = false,
  slots,
  slotProps,

  autoHeight = false,
  height = "clamp(420px, calc(100vh - 300px), 720px)",

  containerSx,
  gridSx,

  ...dataGridProps
}) {
  const mergedInitialState = {
    ...initialState,
    ...(initialState?.density
      ? {}
      : {
          density: "compact",
        }),
  };

  const mergedSlots = {
    noRowsOverlay: DefaultNoRowsOverlay,
    ...slots,
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: autoHeight ? "auto" : height,
        minHeight: autoHeight ? 0 : 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...containerSx,
      }}
    >
      <DataGrid
        {...dataGridProps}
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={getRowId}
        pagination={pagination}
        paginationMode={paginationMode}
        rowCount={paginationMode === "server" ? rowCount : undefined}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        initialState={mergedInitialState}
        showToolbar={showToolbar}
        slots={mergedSlots}
        slotProps={slotProps}
        disableRowSelectionOnClick
        sx={{
          ...DEFAULT_GRID_SX,
          ...gridSx,
        }}
      />
    </Box>
  );
}
