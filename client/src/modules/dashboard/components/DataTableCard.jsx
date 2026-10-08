import { Card, CardContent, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MetricHeader from "./MetricHeader";

function inferColumns(rows) {
  if (!rows.length) return [];

  return Object.keys(rows[0])
    .filter((field) => field !== "__dashboardRowId")
    .map((field) => ({
      field,
      headerName: field
        .replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      flex: 1,
      minWidth: 120,
    }));
}

function buildRows(metric) {
  const sourceRows = Array.isArray(metric?.data) ? metric.data : [];

  return sourceRows.map((row, index) => ({
    ...row,
    __dashboardRowId:
      row?.id ??
      row?.key ??
      row?.code ??
      `${metric.code}:${index}`,
  }));
}

export default function DataTableCard({
  metric,
  viewMode,
  viewModes,
  onViewChange,
}) {
  const rows = buildRows(metric);
  const columns = inferColumns(rows);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderTop: 3,
        borderTopColor: "secondary.main",
      }}
    >
      <CardContent>
        <Stack spacing={1.5} sx={{ height: 360, minWidth: 0 }}>
          <MetricHeader
            metric={metric}
            viewMode={viewMode}
            viewModes={viewModes}
            onViewChange={onViewChange}
          />

          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.__dashboardRowId}
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                  page: 0,
                },
              },
            }}
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "action.hover",
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
