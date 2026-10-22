import { useEffect, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Link, useNavigate, useLocation } from "react-router";

import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import TicketDataGrid from "../components/TicketDataGrid";
import {
  TICKET_GRID_CONFIG,
  TICKET_MODULE_CONFIG,
  TICKET_FIELD_CONFIG,
} from "../../../config/ticket.config";
import { ticketService } from "../services/ticket.service";
import TicketListFilters from "../components/TicketListFilters";
import {
  getTicketListFilterCount,
  TICKET_LIST_FILTER_CONFIG,
} from "../../../config/ticketListFilter.config";
import {
  loadTicketListFilters,
  saveTicketListFilters,
  clearTicketListFilters,
  loadTicketColumnFilterModel,
  saveTicketColumnFilterModel,
  clearTicketColumnFilterModel,
} from "../utils/ticketListViewState";
import BulkEditTicketDrawer from "../components/BulkEditTicketDrawer";

const TICKET_FILTER_QUERY_KEYS = new Set(
  TICKET_LIST_FILTER_CONFIG.flatMap((filter) => {
    if (filter.type === "dateRange") {
      return [filter.fromQueryKey, filter.toQueryKey];
    }

    if (filter.type === "numericRange") {
      return [filter.minQueryKey, filter.maxQueryKey];
    }

    return [filter.queryKey];
  }),
);

function parseTicketFilters(search) {
  const params = new URLSearchParams(search);
  const parsedFilters = {};

  for (const [rawKey, value] of params.entries()) {
    const isArrayParam = rawKey.endsWith("[]");
    const key = isArrayParam ? rawKey.slice(0, -2) : rawKey;

    // Ignore parameters that are not ticket filters.
    if (!TICKET_FILTER_QUERY_KEYS.has(key) || value === "") {
      continue;
    }

    if (isArrayParam || params.getAll(rawKey).length > 1) {
      const existingValues = Array.isArray(parsedFilters[key])
        ? parsedFilters[key]
        : [];

      parsedFilters[key] = [...existingValues, value];
    } else {
      parsedFilters[key] = value;
    }
  }

  return parsedFilters;
}

function isActiveColumnFilter(item) {
  if (!item || typeof item.field !== "string") {
    return false;
  }

  if (["isEmpty", "isNotEmpty"].includes(item.operator)) {
    return true;
  }

  if (Array.isArray(item.value)) {
    return item.value.length > 0;
  }

  return typeof item.value === "string" && item.value.trim().length > 0;
}

export default function TicketsListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTicketVersions, setSelectedTicketVersions] = useState({});
  const [filters, setFilters] = useState(() => {
    const urlFilters = parseTicketFilters(location.search);

    return Object.keys(urlFilters).length > 0
      ? urlFilters
      : loadTicketListFilters();
  });
  const [columnFilterModel, setColumnFilterModel] = useState(() =>
    loadTicketColumnFilterModel(),
  );

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: TICKET_GRID_CONFIG.defaultPageSize,
  });
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);

  useEffect(() => {
    const urlFilters = parseTicketFilters(location.search);

    // A URL without ticket filters should preserve saved filters.
    if (Object.keys(urlFilters).length === 0) {
      return;
    }

    // Explicit URL filters take precedence over stale saved filters.
    setFilters(urlFilters);
    saveTicketListFilters(urlFilters);

    setPaginationModel((currentModel) => ({
      ...currentModel,
      page: 0,
    }));
  }, [location.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());

      setPaginationModel((currentModel) => ({
        ...currentModel,
        page: 0,
      }));
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    const activeColumnFilters = columnFilterModel.items
      .filter(isActiveColumnFilter)
      .map(({ field, operator, value }) => ({
        field,
        operator,
        ...(value !== undefined ? { value } : {}),
      }));

    const columnFilters =
      activeColumnFilters.length > 0
        ? JSON.stringify({
            logicOperator: columnFilterModel.logicOperator ?? "and",
            items: activeColumnFilters,
          })
        : undefined;

    ticketService
      .listTickets({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(search ? { search } : {}),
        ...filters,
        ...(columnFilters ? { columnFilters } : {}),
      })
      .then(({ rows: ticketRows, total }) => {
        if (!active) return;

        setRows(ticketRows ?? []);
        setRowCount(total ?? 0);
      })
      .catch((requestError) => {
        if (!active) return;

        setRows([]);
        setRowCount(0);

        setError(
          requestError.response?.data?.message ??
            requestError.message ??
            "Unable to load tickets.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [paginationModel, search, filters, columnFilterModel, refreshKey]);

  const handlePaginationModelChange = (nextModel) => {
    setPaginationModel((currentModel) => {
      if (nextModel.pageSize !== currentModel.pageSize) {
        return {
          page: 0,
          pageSize: nextModel.pageSize,
        };
      }

      return nextModel;
    });
  };

  const handleApplyFilters = (nextFilters) => {
    setFilters(nextFilters);
    saveTicketListFilters(nextFilters);

    setPaginationModel((currentModel) => ({
      ...currentModel,
      page: 0,
    }));

    setFiltersOpen(false);
  };

  const handleColumnFilterModelChange = (nextModel) => {
    const normalizedModel = {
      items: nextModel.items ?? [],
      logicOperator: nextModel.logicOperator === "or" ? "or" : "and",
    };

    setColumnFilterModel(normalizedModel);
    saveTicketColumnFilterModel(normalizedModel);

    setPaginationModel((currentModel) => ({
      ...currentModel,
      page: 0,
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({});
    clearTicketListFilters();

    const emptyColumnFilterModel = {
      items: [],
      logicOperator: "and",
    };

    setColumnFilterModel(emptyColumnFilterModel);
    clearTicketColumnFilterModel();

    setSearchInput("");
    setSearch("");

    setPaginationModel((currentModel) => ({
      ...currentModel,
      page: 0,
    }));
  };

  const handleSelectedTicketIdsChange = (nextIds) => {
    const visibleRowsById = new Map(rows.map((row) => [row.id, row]));

    setSelectedTicketVersions((current) =>
      Object.fromEntries(
        nextIds
          .map((id) => [id, current[id] ?? visibleRowsById.get(id)?.updatedAt])
          .filter(([, updatedAt]) => Boolean(updatedAt)),
      ),
    );

    setSelectedTicketIds(nextIds);
  };

  const handleBulkUpdate = async (changes) => {
    setBulkUpdating(true);
    setBulkResult(null);

    try {
      const expectedUpdatedAt = Object.fromEntries(
        selectedTicketIds
          .map((id) => [id, selectedTicketVersions[id]])
          .filter(([, updatedAt]) => Boolean(updatedAt)),
      );

      const result = await ticketService.bulkUpdateTickets({
        ticketIds: selectedTicketIds,
        changes,
        expectedUpdatedAt,
      });

      setBulkResult(result);

      const completedIds = result.results
        .filter(
          (item) => item.status === "updated" || item.status === "unchanged",
        )
        .map((item) => item.ticketId);

      setSelectedTicketIds((current) =>
        current.filter((id) => !completedIds.includes(id)),
      );

      setSelectedTicketVersions((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => !completedIds.includes(id)),
        ),
      );

      setBulkEditOpen(false);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setBulkResult({
        requested: selectedTicketIds.length,
        updated: 0,
        unchanged: 0,
        failed: selectedTicketIds.length,
        results: selectedTicketIds.map((ticketId) => ({
          ticketId,
          ticketNumber:
            rows.find((row) => row.id === ticketId)?.ticketNumber ?? ticketId,
          status: "failed",
          message:
            requestError.response?.data?.message ??
            requestError.message ??
            "Unable to process the bulk update.",
        })),
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const hasAnyFilters =
    Boolean(searchInput.trim()) ||
    Object.keys(filters).length > 0 ||
    columnFilterModel.items.some(isActiveColumnFilter);

  return (
    <Stack
      spacing={3}
      flex={1}
      sx={{
        minWidth: 0,
        minHeight: 0,
        width: "100%",
      }}
    >
      <PageHeader
        title={TICKET_MODULE_CONFIG.list.title}
        description={TICKET_MODULE_CONFIG.list.description}
        actions={
          <CanAccess
            permission={TICKET_MODULE_CONFIG.list.createAction.permission}
          >
            <Button
              component={Link}
              to={TICKET_MODULE_CONFIG.list.createAction.path}
              variant="contained"
              startIcon={<AddOutlinedIcon />}
            >
              {TICKET_MODULE_CONFIG.list.createAction.label}
            </Button>
          </CanAccess>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}
      {bulkResult ? (
        <Alert
          severity={
            bulkResult.failed > 0
              ? bulkResult.updated + bulkResult.unchanged > 0
                ? "warning"
                : "error"
              : "success"
          }
          onClose={() => setBulkResult(null)}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={700}>
              Bulk Update: {bulkResult.updated} updated, {bulkResult.unchanged}{" "}
              unchanged, {bulkResult.failed} failed.
            </Typography>

            {bulkResult.results
              .filter((item) => item.status === "failed")
              .map((item) => (
                <Typography
                  key={item.ticketId}
                  variant="body2"
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {item.ticketNumber}: {item.message}
                </Typography>
              ))}
          </Stack>
        </Alert>
      ) : null}

      <TicketDataGrid
        rows={rows}
        rowCount={rowCount}
        selectedTicketIds={selectedTicketIds}
        onSelectedTicketIdsChange={handleSelectedTicketIdsChange}
        onBulkEdit={() => setBulkEditOpen(true)}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        paginationMode="server"
        filterModel={columnFilterModel}
        onFilterModelChange={handleColumnFilterModelChange}
        onClearAllFilters={handleClearAllFilters}
        hasAnyFilters={hasAnyFilters}
        fields={TICKET_FIELD_CONFIG}
        columns={[TICKET_GRID_CONFIG.action, ...TICKET_GRID_CONFIG.columns]}
        pageSizeOptions={TICKET_GRID_CONFIG.pageSizeOptions}
        defaultPageSize={TICKET_GRID_CONFIG.defaultPageSize}
        title={TICKET_MODULE_CONFIG.list.title}
        fallback={TICKET_MODULE_CONFIG.labels.notAvailable}
        loading={loading}
        onOpenTicket={(row) => navigate(`/tickets/${row.id}`)}
        onDuplicateTicket={(ticketId) =>
          navigate(
            `/tickets/create?duplicateFrom=${encodeURIComponent(ticketId)}`,
          )
        }
        search={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={getTicketListFilterCount(filters)}
      />

      <TicketListFilters
        open={filtersOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFiltersOpen(false)}
      />

      <BulkEditTicketDrawer
        open={bulkEditOpen}
        selectedCount={selectedTicketIds.length}
        submitting={bulkUpdating}
        onClose={() => setBulkEditOpen(false)}
        onSubmit={handleBulkUpdate}
      />
    </Stack>
  );
}
