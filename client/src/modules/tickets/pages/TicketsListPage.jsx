import { useEffect, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Link, useNavigate } from "react-router";

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
import { getTicketListFilterCount } from "../../../config/ticketListFilter.config";

export default function TicketsListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: TICKET_GRID_CONFIG.defaultPageSize,
  });

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

    ticketService
      .listTickets({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(search ? { search } : {}),
        ...filters,
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
  }, [paginationModel, search, filters]);

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

    setPaginationModel((currentModel) => ({
      ...currentModel,
      page: 0,
    }));

    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});

    setPaginationModel((currentModel) => ({
      ...currentModel,
      page: 0,
    }));
  };

  return (
    <Stack spacing={3}>
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

      <TicketDataGrid
        rows={rows}
        rowCount={rowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        paginationMode="server"
        fields={TICKET_FIELD_CONFIG}
        columns={[TICKET_GRID_CONFIG.action, ...TICKET_GRID_CONFIG.columns]}
        pageSizeOptions={TICKET_GRID_CONFIG.pageSizeOptions}
        defaultPageSize={TICKET_GRID_CONFIG.defaultPageSize}
        title={TICKET_MODULE_CONFIG.list.title}
        fallback={TICKET_MODULE_CONFIG.labels.notAvailable}
        loading={loading}
        onOpenTicket={(row) => navigate(`/tickets/${row.id}`)}
        search={searchInput}
        onSearchChange={setSearchInput}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={getTicketListFilterCount(filters)}
      />

      <TicketListFilters
        open={filtersOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </Stack>
  );
}
