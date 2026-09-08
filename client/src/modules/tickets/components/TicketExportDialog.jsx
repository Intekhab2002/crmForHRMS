import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import { useNotification } from "../../../components/feedback";
import { ticketService } from "../services/ticket.service";
import { TICKET_EXPORT_CONFIG } from "../config/ticketExport.config";
import { buildTicketExportPayload } from "../utils/ticketExportPayload";
import { triggerBlobDownload } from "../utils/ticketExport";

const DEFAULT_MODE = "all";

export default function TicketExportDialog({
  open,
  onClose,
  selectedTicketIds = [],
  search = "",
  filters = {},
  rowCount = 0,
}) {
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [isExporting, setIsExporting] = useState(false);

  const { success, error: notifyError } = useNotification();

  const hasSelection = selectedTicketIds.length > 0;

  const currentFilteredCount = useMemo(
    () => Number(rowCount ?? 0),
    [rowCount],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(hasSelection ? "selected" : DEFAULT_MODE);
    setIsExporting(false);
  }, [open, hasSelection]);

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === "selected" && !hasSelection) {
      return;
    }

    setMode(nextMode);
  };

  const handleExport = async () => {
    if (mode === "selected" && !hasSelection) {
      notifyError("Select at least one ticket to export.");
      return;
    }

    setIsExporting(true);

    try {
      const payload = buildTicketExportPayload({
        mode,
        selectedTicketIds,
        search,
        filters,
      });

      const result = await ticketService.exportTickets(payload);

      triggerBlobDownload(
        result.blob,
        result.filename || "tickets-export.csv",
      );

      success("Ticket export downloaded successfully.");
      onClose();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.message ??
        "Unable to export tickets.";

      notifyError(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="ticket-export-dialog-title"
      aria-describedby="ticket-export-dialog-description"
    >
      <DialogTitle id="ticket-export-dialog-title">
        {TICKET_EXPORT_CONFIG.title}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography
            id="ticket-export-dialog-description"
            variant="body2"
            color="text.secondary"
          >
            {TICKET_EXPORT_CONFIG.description}
          </Typography>

          <ExportOption
            selected={mode === "selected"}
            disabled={!hasSelection}
            onClick={() => handleModeChange("selected")}
            label={TICKET_EXPORT_CONFIG.modes.selected.label}
            description={
              hasSelection
                ? `${selectedTicketIds.length.toLocaleString()} ticket${
                    selectedTicketIds.length === 1 ? "" : "s"
                  } selected`
                : "No tickets selected"
            }
          />

          <ExportOption
            selected={mode === "filtered"}
            onClick={() => handleModeChange("filtered")}
            label={TICKET_EXPORT_CONFIG.modes.filtered.label}
            description={
              currentFilteredCount > 0
                ? `${currentFilteredCount.toLocaleString()} ticket${
                    currentFilteredCount === 1 ? "" : "s"
                  } match the current search and filters`
                : "No tickets match the current search and filters"
            }
          />

          <ExportOption
            selected={mode === "all"}
            onClick={() => handleModeChange("all")}
            label={TICKET_EXPORT_CONFIG.modes.all.label}
            description={TICKET_EXPORT_CONFIG.modes.all.description}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isExporting}>
          {TICKET_EXPORT_CONFIG.cancelLabel}
        </Button>

        <Button
          variant="contained"
          startIcon={
            isExporting ? undefined : <DownloadOutlinedIcon />
          }
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting
            ? TICKET_EXPORT_CONFIG.submittingLabel
            : TICKET_EXPORT_CONFIG.submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ExportOption({
  selected,
  disabled = false,
  onClick,
  label,
  description,
}) {
  return (
    <Paper
      variant="outlined"
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        width: "100%",
        p: 2,
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "background.paper",
        opacity: disabled ? 0.6 : 1,
        transition: (theme) =>
          theme.transitions.create(["border-color", "background-color"]),
        "&:hover": {
          borderColor: disabled ? "divider" : "primary.main",
          bgcolor: disabled ? "background.paper" : "action.hover",
        },
        "&:focus-visible": {
          outline: 2,
          outlineOffset: 2,
          outlineColor: "primary.main",
        },
      }}
    >
      {selected ? (
        <CheckCircleOutlinedIcon
          color="primary"
          fontSize="small"
          sx={{ mt: 0.25 }}
        />
      ) : (
        <Radio
          checked={false}
          disabled={disabled}
          size="small"
          sx={{ p: 0.25, mt: 0.05 }}
        />
      )}

      <Stack spacing={0.25}>
        <Typography variant="subtitle2">{label}</Typography>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}