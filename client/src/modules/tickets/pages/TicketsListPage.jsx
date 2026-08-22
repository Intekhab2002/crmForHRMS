import { useEffect, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Link, useNavigate } from "react-router";
import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import TicketDataGrid from "../components/TicketDataGrid";
import { useAppConfig } from "../../../context/useAppConfig";
import { ticketService } from "../services/ticket.service";

export default function TicketsListPage() {
  const navigate = useNavigate();
  const { ticket } = useAppConfig();
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      ticketService.listTickets({
        page: 1,
        limit: ticket.list.defaultPageSize,
      }),
      ticketService.getFields("detail"),
    ])
      .then(([tickets, schema]) => {
        if (!active) return;

        setRows(tickets?? []);
        setFields(schema);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

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

  const handleOpenTicket = (row) => {
    navigate(`/tickets/${row.id}`);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title={ticket.list.title}
        description={ticket.list.description}
        actions={
          <CanAccess permission={ticket.list.createAction.permission}>
            <Button
              component={Link}
              to={ticket.list.createAction.path}
              variant="contained"
              startIcon={<AddOutlinedIcon />}
            >
              {ticket.list.createAction.label}
            </Button>
          </CanAccess>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <TicketDataGrid
        rows={rows}
        fields={fields}
        columns={ticket.list.columns}
        pageSizeOptions={ticket.list.pageSizeOptions}
        defaultPageSize={ticket.list.defaultPageSize}
        title={ticket.list.title}
        fallback={ticket.labels.notAvailable}
        loading={loading}
        onOpenTicket={handleOpenTicket}
      />
    </Stack>
  );
}
