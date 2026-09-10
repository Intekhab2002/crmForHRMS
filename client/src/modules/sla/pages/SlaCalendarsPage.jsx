import { useState } from "react";
import { Alert, Button, Chip, Paper, Stack, TextField } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { DataGrid } from "@mui/x-data-grid";
import { Link, useNavigate } from "react-router";
import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import { useSlaCalendars } from "../hooks/useSlaCalendars";
import { SLA_PERMISSIONS, SLA_ROUTES } from "../config/sla.config";

export default function SlaCalendarsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pageModel, setPageModel] = useState({ page: 0, pageSize: 20 });
  const { rows, meta, loading, error } = useSlaCalendars({
    page: pageModel.page + 1,
    limit: pageModel.pageSize,
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  function getCalendarId(row) {
    const id = row?.id;

    return typeof id === "string" && id.trim() ? id : null;
  }
  const columns = [
    { field: "name", headerName: "Calendar", flex: 1.3, minWidth: 220 },
    { field: "code", headerName: "Code", width: 170 },
    { field: "timezone", headerName: "Timezone", width: 170 },
    { field: "business_hours_per_day", headerName: "Hours/day", width: 110 },
    { field: "workday_start_time", headerName: "Start", width: 90 },
    { field: "workday_end_time", headerName: "End", width: 90 },
    {
      field: "include_saturday",
      headerName: "Sat",
      width: 80,
      renderCell: ({ value }) => (value ? "Included" : "Excluded"),
    },
    {
      field: "include_sunday",
      headerName: "Sun",
      width: 80,
      renderCell: ({ value }) => (value ? "Included" : "Excluded"),
    },
    {
      field: "is_active",
      headerName: "Status",
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value ? "Active" : "Inactive"}
          color={value ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
  ];

  return (
    <Stack spacing={2.5} flex={1} minHeight={0}>
      <PageHeader
        title="SLA Calendars"
        description="Configure working hours, weekend behavior, timezone, and yearly holidays."
        actions={
          <CanAccess permission={SLA_PERMISSIONS.calendarCreate}>
            <Button
              component={Link}
              to={`${SLA_ROUTES.calendars}/new`}
              variant="contained"
              startIcon={<AddOutlinedIcon />}
            >
              Create calendar
            </Button>
          </CanAccess>
        }
      />
      <TextField
        size="small"
        label="Search calendars"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPageModel((current) => ({ ...current, page: 0 }));
        }}
        sx={{ maxWidth: 360 }}
      />
      {error ? (
        <Alert severity="error">
          {error.response?.data?.message ??
            error.message ??
            "Unable to load calendars."}
        </Alert>
      ) : null}
      <Paper variant="outlined" sx={{ flex: 1, minHeight: 420 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          paginationMode="server"
          rowCount={Number(meta.total ?? 0)}
          paginationModel={pageModel}
          onPaginationModelChange={setPageModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          onRowClick={({ row }) => {
            const calendarId = getCalendarId(row);

            if (!calendarId) {
              return;
            }

            navigate(SLA_ROUTES.calendarDetail(calendarId));
          }}
          sx={{ border: 0 }}
        />
      </Paper>
    </Stack>
  );
}
