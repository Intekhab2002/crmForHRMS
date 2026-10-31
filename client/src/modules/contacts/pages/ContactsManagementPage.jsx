import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArrowCircleRightOutlinedIcon from "@mui/icons-material/ArrowCircleRightOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import ConfirmationDialog from "../../../components/feedback/ConfirmationDialog";
import PageHeader from "../../../components/page/PageHeader";
import { AppDataGrid } from "../../../components/data-grid";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../config/permission.config";
import ContactFilters from "../components/ContactFilters";
import ContactFormDialog from "../components/ContactFormDialog";
import contactService, {
  getContactErrorMessage,
} from "../services/contact.service";
import { useNotification } from "../../../components/feedback";

function getOptionLabel(value, fallback = "—") {
  if (value && typeof value === "object") {
    return value.name ?? value.label ?? fallback;
  }
  return value || fallback;
}

function normalizeContact(row) {
  return {
    ...row,
    organizationId: row.organizationId ?? row.organization_id ?? "",
    organizationName:
      row.organizationName ??
      row.organization_name ??
      row.organization?.name ??
      "",
    departmentId: row.departmentId ?? row.department_id ?? "",
    departmentName:
      row.departmentName ?? row.department_name ?? row.department?.name ?? "",
    districtId: row.districtId ?? row.district_id ?? row.district?.id ?? "",
    districtName:
      row.districtName ?? row.district_name ?? row.district?.name ?? "",
    mobilePhone: row.mobilePhone ?? row.mobile_phone ?? "",
    ticketCount: Number(row.ticketCount ?? row.ticket_count ?? 0),
    isActive: row.isActive ?? row.is_active ?? true,
  };
}

function getActiveFilterCount(filters) {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === "isActive") return value !== undefined && value !== true;
    return value !== undefined && value !== null && value !== "";
  }).length;
}

function getErrorMessage(error) {
  return getContactErrorMessage(error);
}

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_LOOKUPS = Object.freeze({
  organizations: [],
  departments: [],
  districts: [],
});

const DEFAULT_FILTERS = Object.freeze({
  isActive: true,
});

export default function ContactsManagementPage() {
  const navigate = useNavigate();
  const notification = useNotification();
  const { hasPermission } = useAuth();

  const canRead = hasPermission(PERMISSIONS.CONTACT_READ);
  const canCreate = hasPermission(PERMISSIONS.CONTACT_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.CONTACT_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.CONTACT_DELETE);
  const canReadTickets = hasPermission(PERMISSIONS.TICKET_READ);
  const canRestore = hasPermission(PERMISSIONS.CONTACT_RESTORE);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [lookupState, setLookupState] = useState({
    status: "idle",
    data: EMPTY_LOOKUPS,
    error: "",
  });

  const lookups = lookupState.data;

  const needsLookups = canRead && (canCreate || canUpdate);

  const lookupsLoading = needsLookups && lookupState.status === "idle";

  const lookupError = lookupState.error;

  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contactToDeactivate, setContactToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [contactToReactivate, setContactToReactivate] = useState(null);
  const [reactivating, setReactivating] = useState(false);
  const [filterDialogKey, setFilterDialogKey] = useState(0);
  const [formDialogKey, setFormDialogKey] = useState(0);

  const handleOpenFilters = () => {
    setFilterDialogKey((current) => current + 1);
    setFilterOpen(true);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      setSearch((current) => (current === nextSearch ? current : nextSearch));

      setPaginationModel((current) =>
        current.page === 0 ? current : { ...current, page: 0 },
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const [lookupRetryKey, setLookupRetryKey] = useState(0);

  const loadLookups = useCallback(async () => {
    return Promise.allSettled([
      contactService.listOrganizations(),
      contactService.listDepartments(),
      contactService.listDistricts(),
    ]);
  }, []);

  const handleRetryLookups = useCallback(() => {
    setLookupState((current) => ({
      ...current,
      status: "idle",
      error: "",
    }));

    setLookupRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!needsLookups) return undefined;

    let active = true;

    const load = async () => {
      try {
        const results = await loadLookups();

        if (!active) return;

        const keys = ["organizations", "departments", "districts"];

        const data = { ...EMPTY_LOOKUPS };
        const failures = [];

        results.forEach((result, index) => {
          const key = keys[index];

          if (result.status === "fulfilled") {
            data[key] = result.value ?? [];
          } else {
            failures.push(result.reason);
          }
        });

        const successfulCount = results.filter(
          (result) => result.status === "fulfilled",
        ).length;

        setLookupState({
          status: successfulCount > 0 ? "success" : "error",
          data,
          error:
            failures.length > 0
              ? "Some lookup options could not be loaded. Please retry."
              : "",
        });
      } catch (error) {
        if (!active) return;

        setLookupState({
          status: "error",
          data: EMPTY_LOOKUPS,
          error: getErrorMessage(error),
        });
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [needsLookups, loadLookups, lookupRetryKey]);

  useEffect(() => {
    if (!canRead) return;

    let active = true;

    setLoading(true);
    setLoadError("");

    contactService
      .listContacts({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search,
        ...filters,
      })
      .then((result) => {
        if (!active) return;
        setRows((result.rows ?? []).map(normalizeContact));
        setRowCount(Number(result.total ?? 0));
      })
      .catch((error) => {
        if (!active) return;
        setRows([]);
        setRowCount(0);
        setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canRead, filters, paginationModel, refreshKey, search]);

  const handlePaginationChange = (nextModel) => {
    setPaginationModel((current) => {
      if (nextModel.pageSize !== current.pageSize) {
        return { page: 0, pageSize: nextModel.pageSize };
      }
      return nextModel;
    });
  };

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormDialogKey((current) => current + 1);
    setFormOpen(true);
  };

  const handleOpenEdit = useCallback((contact) => {
    setEditingContact(contact);
    setFormDialogKey((current) => current + 1);
    setFormOpen(true);
  }, []);
  const handleSaveContact = async (payload) => {
    setSaving(true);
    try {
      if (editingContact) {
        await contactService.updateContact(editingContact.id, payload);
        notification.success("Contact updated successfully.");
      } else {
        await contactService.createContact(payload);
        notification.success("Contact created successfully.");
      }

      setFormOpen(false);
      setEditingContact(null);
      setPaginationModel((current) => ({ ...current, page: 0 }));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      notification.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!contactToDeactivate) return;

    setDeactivating(true);
    try {
      await contactService.deactivateContact(contactToDeactivate.id);
      notification.success("Contact deactivated successfully.");
      setContactToDeactivate(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      notification.error(getErrorMessage(error));
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    if (!contactToReactivate || reactivating) return;

    setReactivating(true);

    try {
      await contactService.reactivateContact(contactToReactivate.id);

      notification.success("Contact reactivated successfully.");
      setContactToReactivate(null);

      // Refresh the grid while preserving the selected status filter.
      setRefreshKey((current) => current + 1);
    } catch (error) {
      notification.error(getErrorMessage(error));
    } finally {
      setReactivating(false);
    }
  };

  const handleApplyFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPaginationModel((current) => ({ ...current, page: 0 }));
    setFilterOpen(false);
  };

  const handleShowTickets = useCallback(
    (contact) => {
      const mobileNumber = String(contact.mobilePhone ?? "").trim();

      if (!mobileNumber) {
        notification.warning(
          "This contact does not have a mobile number, so its tickets cannot be filtered by mobile number.",
        );
        return;
      }

      const query = new URLSearchParams({ mobileNumber });

      navigate(`/tickets?${query.toString()}`);
    },
    [navigate, notification.warning],
  );

  const organizationNamesById = useMemo(
    () =>
      new Map(
        lookups.organizations.map((organization) => [
          organization.id ?? organization.value,
          organization.name ?? organization.label ?? organization.title ?? "",
        ]),
      ),
    [lookups.organizations],
  );

  const columns = useMemo(() => {
    const nextColumns = [
      {
        field: "actions",
        headerName: "Actions",
        minWidth: canReadTickets ? 100 : 80,
        flex: 0.8,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {canReadTickets && (
              <Tooltip title="Show Tickets">
                <IconButton
                  size="small"
                  onClick={() => handleShowTickets(params.row)}
                >
                  <ArrowCircleRightOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canUpdate && params.row.isActive && (
              <Tooltip title="Edit contact">
                <IconButton
                  size="small"
                  aria-label={`Edit ${params.row.name}`}
                  onClick={() => handleOpenEdit(params.row)}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && params.row.isActive && (
              <Tooltip title="Deactivate contact">
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Deactivate ${params.row.name}`}
                  onClick={() => setContactToDeactivate(params.row)}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {canRestore && !params.row.isActive && (
              <Tooltip title="Reactivate contact">
                <IconButton
                  size="small"
                  color="success"
                  aria-label={`Reactivate ${params.row.name}`}
                  onClick={() => setContactToReactivate(params.row)}
                >
                  <RestoreOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
      {
        field: "name",
        headerName: "Contact Name",
        minWidth: 170,
        flex: 1,
      },
      {
        field: "mobilePhone",
        headerName: "Mobile",
        minWidth: 135,
        flex: 0.8,
      },
      {
        field: "email",
        headerName: "Email",
        minWidth: 190,
        flex: 1,
        valueGetter: (_value, row) => row.email || "—",
      },
      {
        field: "organizationName",
        headerName: "Organization",
        minWidth: 170,
        flex: 1,
        renderCell: (params) => (
          <span>
            {params.row.organizationName ||
              organizationNamesById.get(params.row.organizationId) ||
              "—"}
          </span>
        ),
      },
      {
        field: "departmentName",
        headerName: "Department",
        minWidth: 150,
        flex: 0.8,
        valueGetter: (_value, row) => getOptionLabel(row.departmentName),
      },
      {
        field: "districtName",
        headerName: "District",
        minWidth: 130,
        flex: 0.7,
        valueGetter: (_value, row) => getOptionLabel(row.districtName),
      },
      {
        field: "ticketCount",
        headerName: "Tickets",
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            variant="outlined"
            label={params.row.ticketCount}
            color={params.row.ticketCount > 0 ? "primary" : "default"}
          />
        ),
      },
      {
        field: "isActive",
        headerName: "Status",
        minWidth: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.isActive ? "Active" : "Inactive"}
            color={params.row.isActive ? "success" : "default"}
            variant={params.row.isActive ? "filled" : "outlined"}
          />
        ),
      },
    ];

    return nextColumns;
  }, [
    canDelete,
    canReadTickets,
    canRestore,
    canUpdate,
    handleOpenEdit,
    handleShowTickets,
    organizationNamesById,
  ]);

  if (!canRead) {
    return (
      <Alert severity="error">
        You do not have permission to view contacts.
      </Alert>
    );
  }

  return (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <PageHeader
        title="Contacts"
        description="Manage contact records and view their associated tickets."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={handleOpenCreate}
              >
                Add Contact
              </Button>
            )}
          </Stack>
        }
      />

      {loadError ? (
        <Alert
          severity="error"
          onClose={() => setLoadError("")}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : null}

      {lookupError && (canCreate || canUpdate) ? (
        <Alert
          severity="warning"
          onClose={() =>
            setLookupState((current) => ({
              ...current,
              error: "",
            }))
          }
          action={
            <Button color="inherit" size="small" onClick={handleRetryLookups}>
              Retry
            </Button>
          }
        >
          {lookupError}
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          size="small"
          fullWidth
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search name, mobile, email, organization..."
          inputProps={{ "aria-label": "Search contacts" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterAltOutlinedIcon />}
          onClick={handleOpenFilters}
          sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Filters
          {getActiveFilterCount(filters) > 0
            ? ` (${getActiveFilterCount(filters)})`
            : ""}
        </Button>

        {getActiveFilterCount(filters) > 0 && (
          <Button
            color="inherit"
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
            sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
          >
            Clear filters
          </Button>
        )}
      </Paper>

      <Box sx={{ flex: 1, minHeight: 280, minWidth: 0 }}>
        <Paper
          variant="outlined"
          sx={{
            height: "100%",
            minHeight: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <AppDataGrid
            aria-label="Contacts"
            rows={rows}
            columns={columns}
            loading={loading || lookupsLoading}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[20, 50, 100]}
            disableColumnFilter
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            gridSx={{
              "& .MuiDataGrid-cell": {
                py: 0.5,
              },
            }}
          />
        </Paper>
      </Box>

      <ContactFilters
        key={filterDialogKey}
        open={filterOpen}
        filters={filters}
        organizations={lookups.organizations}
        departments={lookups.departments}
        districts={lookups.districts}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />

      <ContactFormDialog
        key={formDialogKey}
        open={formOpen}
        contact={editingContact}
        organizations={lookups.organizations}
        departments={lookups.departments}
        districts={lookups.districts}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditingContact(null);
          }
        }}
        onSubmit={handleSaveContact}
      />

      <ConfirmationDialog
        open={Boolean(contactToDeactivate)}
        title="Deactivate Contact"
        message={
          contactToDeactivate
            ? `Deactivate ${contactToDeactivate.name}? Existing tickets and ticket history will be retained.`
            : "Deactivate this contact?"
        }
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={deactivating}
        onCancel={() => setContactToDeactivate(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmationDialog
        open={Boolean(contactToReactivate)}
        title="Reactivate Contact"
        message={
          contactToReactivate
            ? `Reactivate ${contactToReactivate.name}? The existing contact record and its ticket history will be retained.`
            : "Reactivate this contact?"
        }
        confirmLabel="Reactivate"
        loading={reactivating}
        onCancel={() => {
          if (!reactivating) {
            setContactToReactivate(null);
          }
        }}
        onConfirm={handleReactivate}
      />
    </Stack>
  );
}
