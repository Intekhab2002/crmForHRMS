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

export default function TicketsListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    ticketService
      .listTickets({
        page: 1,
        limit: TICKET_GRID_CONFIG.defaultPageSize,
      })
      .then((tickets) => {
        if (active) setRows(tickets ?? []);
      })
      .catch((requestError) => {
        if (!active) return;

        setError(
          requestError.response?.data?.message ??
            requestError.message ??
            "Unable to load tickets.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
        fields={TICKET_FIELD_CONFIG}
        columns={[TICKET_GRID_CONFIG.action, ...TICKET_GRID_CONFIG.columns]}
        pageSizeOptions={TICKET_GRID_CONFIG.pageSizeOptions}
        defaultPageSize={TICKET_GRID_CONFIG.defaultPageSize}
        title={TICKET_MODULE_CONFIG.list.title}
        fallback={TICKET_MODULE_CONFIG.labels.notAvailable}
        loading={loading}
        onOpenTicket={(row) => navigate(`/tickets/${row.id}`)}
      />
    </Stack>
  );
}
