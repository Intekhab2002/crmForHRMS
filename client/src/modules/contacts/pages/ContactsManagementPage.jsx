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
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ConfirmationDialog from "../../../components/feedback/ConfirmationDialog";
import PageHeader from "../../../components/page/PageHeader";
import { AppDataGrid } from "../../../components/data-grid";
import { useNotification } from "../../../components/feedback/NotificationProvider";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../config/permission.config";
import ContactFilters from "../components/ContactFilters";
import ContactFormDialog from "../components/ContactFormDialog";
import contactService, { getContactErrorMessage } from "../services/contact.service";

const DEFAULT_PAGE_SIZE = 20;

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
      row.organizationName ?? row.organization_name ?? row.organization?.name ?? "",
    departmentId: row.departmentId ?? row.department_id ?? "",
    departmentName:
      row.departmentName ?? row.department_name ?? row.department?.name ?? "",
    districtId:
      row.districtId ?? row.district_id ?? row.district?.id ?? "",
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

export default function ContactsManagementPage() {
  const navigate = useNavigate();
  const notification = useNotification();
  const { hasPermission } = useAuth();

  const canRead = hasPermission(PERMISSIONS.CONTACT_READ);
  const canCreate = hasPermission(PERMISSIONS.CONTACT_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.CONTACT_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.CONTACT_DELETE);
  const canReadTickets = hasPermission(PERMISSIONS.TICKET_READ);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ isActive: true });
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [lookups, setLookups] = useState({
    organizations: [],
    departments: [],
    districts: [],
  });
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contactToDeactivate, setContactToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPaginationModel((current) => ({ ...current, page: 0 }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    setLookupError("");

    const [organizations, departments, districts] = await Promise.allSettled([
      contactService.listOrganizations(),
      contactService.listDepartments(),
      contactService.listDistricts(),
    ]);

    const failures = [];
    const next = {};

    for (const [key, result] of [
      ["organizations", organizations],
      ["departments", departments],
      ["districts", districts],
    ]) {
      if (result.status === "fulfilled") {
        next[key] = result.value;
      } else {
        next[key] = [];
        failures.push(result.reason);
      }
    }

    setLookups(next);
    setLookupsLoading(false);

    if (failures.length) {
      setLookupError(
        "Some lookup options could not be loaded. Check your access to organizations, departments, and districts.",
      );
    }
  }, []);

  useEffect(() => {
    if (!canRead) {
      setRows([]);
      setRowCount(0);
      setLoading(false);
      return undefined;
    }

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

  useEffect(() => {
    if (canRead && (canCreate || canUpdate)) {
      void loadLookups();
    }
  }, [canCreate, canRead, canUpdate, loadLookups]);

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
    setFormOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setFormOpen(true);
  };

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

  const handleApplyFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPaginationModel((current) => ({ ...current, page: 0 }));
    setFilterOpen(false);
  };

  const handleShowTickets = (contact) => {
    const query = new URLSearchParams();
    query.append("contactId[]", contact.id);
    navigate(`/tickets?${query.toString()}`);
  };

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
      {
        field: "actions",
        headerName: "Actions",
        minWidth: canReadTickets ? 230 : 130,
        flex: 0.8,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {canReadTickets && (
              <Button
                size="small"
                onClick={() => handleShowTickets(params.row)}
                sx={{ whiteSpace: "nowrap" }}
              >
                Show Tickets
              </Button>
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
          </Stack>
        ),
      },
    ];

    return nextColumns;
  }, [canDelete, canReadTickets, canUpdate, organizationNamesById]);

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
        <Alert severity="warning" onClose={() => setLookupError("")}>
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
          onClick={() => setFilterOpen(true)}
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
              setFilters({});
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
        open={filterOpen}
        filters={filters}
        organizations={lookups.organizations}
        departments={lookups.departments}
        districts={lookups.districts}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />

      <ContactFormDialog
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
    </Stack>
  );
}
