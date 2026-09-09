import { useMemo, useState } from "react";
import { Alert, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { DataGrid } from "@mui/x-data-grid";
import { Link, useNavigate } from "react-router";
import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import { useSlaPolicies } from "../hooks/useSlaPolicies";
import { SLA_PERMISSIONS, SLA_ROUTES } from "../config/sla.config";

export default function SlaPoliciesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pageModel, setPageModel] = useState({ page: 0, pageSize: 20 });
  const params = useMemo(() => ({
    page: pageModel.page + 1,
    limit: pageModel.pageSize,
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [pageModel, search]);
  const { rows, meta, loading, error } = useSlaPolicies(params);

  const columns = [
    { field: "name", headerName: "Policy", flex: 1.3, minWidth: 220 },
    { field: "code", headerName: "Code", width: 170 },
    { field: "trigger_field_key", headerName: "Trigger field", width: 180 },
    { field: "trigger_value_key", headerName: "Trigger value", width: 170 },
    { field: "calendar_name", headerName: "Calendar", flex: 1, minWidth: 180 },
    { field: "priority", headerName: "Priority", width: 100 },
    {
      field: "is_active",
      headerName: "Status",
      width: 120,
      renderCell: ({ value }) => <Chip size="small" label={value ? "Active" : "Inactive"} color={value ? "success" : "default"} variant="outlined" />,
    },
  ];

  return (
    <Stack spacing={2.5} flex={1} minHeight={0}>
      <PageHeader
        title="SLA Policies"
        description="Define when SLA tracking starts and how resolution time is assigned."
        actions={
          <CanAccess permission={SLA_PERMISSIONS.create}>
            <Button component={Link} to={SLA_ROUTES.policyCreate} variant="contained" startIcon={<AddOutlinedIcon />}>Create policy</Button>
          </CanAccess>
        }
      />
      <TextField
        size="small"
        label="Search policies"
        value={search}
        onChange={(event) => { setSearch(event.target.value); setPageModel((current) => ({ ...current, page: 0 })); }}
        sx={{ maxWidth: 360 }}
        inputProps={{ "aria-label": "Search SLA policies" }}
      />
      {error ? <Alert severity="error">{error.response?.data?.message ?? error.message ?? "Unable to load SLA policies."}</Alert> : null}
      <Paper variant="outlined" sx={{ flex: 1, minHeight: 420 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={Number(meta.total ?? 0)}
          paginationModel={pageModel}
          onPaginationModelChange={setPageModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          onRowClick={({ id }) => navigate(SLA_ROUTES.policyDetail(id))}
          localeText={{ noRowsLabel: "No SLA policies found." }}
          sx={{ border: 0 }}
        />
      </Paper>
      <Typography variant="caption" color="text.secondary">Priority is backend-resolved; lower numeric priority has higher precedence in the policy model.</Typography>
    </Stack>
  );
}
