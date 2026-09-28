import { Card, CardContent, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

function inferColumns(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0])
    .filter((field) => field !== "id")
    .map((field) => ({
      field,
      headerName: field.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      flex: 1,
      minWidth: 120,
    }));
}

export default function DataTableCard({ metric }) {
  const rows = Array.isArray(metric.data) ? metric.data : [];
  const columns = inferColumns(rows);

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1.5} sx={{ height: 360 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {metric.label}
          </Typography>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
