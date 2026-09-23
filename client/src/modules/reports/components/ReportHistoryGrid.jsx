import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Stack } from "@mui/material";

export default function ReportHistoryGrid({
  rows,
  loading,
  meta,
  onPageChange,
  onRefresh,
  onDownload,
  onView,
  canDownload = false,
}) {
  const columns = [
    { field: "report_id", headerName: "Report ID", minWidth: 210, flex: 1 },
    { field: "report_code", headerName: "Type", minWidth: 150 },
    {
      field: "period_start",
      headerName: "Period",
      minWidth: 220,
      valueGetter: (_, row) =>
        `${new Date(row.period_start).toLocaleString()} → ${new Date(row.period_end).toLocaleString()}`,
    },
    { field: "status", headerName: "Status", minWidth: 120 },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 220,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" onClick={() => onView(row.id)}>View</Button>
          {canDownload && row.status === "COMPLETED" && (
            <>
              <Button size="small" onClick={() => onDownload(row.id, "pdf")}>PDF</Button>
              <Button size="small" onClick={() => onDownload(row.id, "xlsx")}>Excel</Button>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        paginationMode="server"
        rowCount={meta.total || 0}
        paginationModel={{
          page: Math.max((meta.page || 1) - 1, 0),
          pageSize: meta.limit || 20,
        }}
        onPaginationModelChange={({ page }) => onPageChange(page + 1)}
        pageSizeOptions={[20]}
      />
      <Button size="small" onClick={onRefresh} sx={{ mt: 1 }}>
        Refresh
      </Button>
    </Box>
  );
}
