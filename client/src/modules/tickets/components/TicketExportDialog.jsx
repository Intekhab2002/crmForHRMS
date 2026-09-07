import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import { useNotification } from "../../../components/feedback";
import { ticketService } from "../services/ticket.service";
import { TICKET_EXPORT_CONFIG } from "../config/ticketExport.config";
import {
  getTicketExportPresetRange,
  parseDateInput,
  toDateInputValue,
  triggerBlobDownload,
} from "../utils/ticketExport";

function getInitialRange() {
  const today = toDateInputValue();

  return {
    fromDate: today,
    toDate: today,
  };
}

export default function TicketExportDialog({ open, onClose }) {
  const [range, setRange] = useState(getInitialRange);
  const [errors, setErrors] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("today");

  const { success, error: notifyError } = useNotification();

  const today = useMemo(() => toDateInputValue(), []);

  useEffect(() => {
    if (!open) return;

    setRange(getInitialRange());
    setErrors({});
    setSelectedPreset("today");
    setIsExporting(false);
  }, [open]);

  const validate = () => {
    const nextErrors = {};
    const from = parseDateInput(range.fromDate);
    const to = parseDateInput(range.toDate);

    if (!from) {
      nextErrors.fromDate = "Enter a valid date.";
    }

    if (!to) {
      nextErrors.toDate = "Enter a valid date.";
    }

    if (from && to && from > to) {
      nextErrors.toDate = "To date cannot be earlier than From date.";
    }

    if (range.fromDate > today) {
      nextErrors.fromDate = "From date cannot be in the future.";
    }

    if (range.toDate > today) {
      nextErrors.toDate = "To date cannot be in the future.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDateChange = (field) => (event) => {
    setSelectedPreset("custom");
    setRange((current) => ({
      ...current,
      [field]: event.target.value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
      ...(field === "fromDate" ? { toDate: "" } : {}),
    }));
  };

  const handlePresetChange = (_event, preset) => {
    if (!preset) return;

    const nextRange = getTicketExportPresetRange(preset);

    if (!nextRange) return;

    setSelectedPreset(preset);
    setRange(nextRange);
    setErrors({});
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const handleExport = async () => {
    if (!validate()) return;

    setIsExporting(true);

    try {
      const result = await ticketService.exportTickets(range);
      const fallbackFilename = `tickets-${range.fromDate}-to-${range.toDate}.csv`;

      triggerBlobDownload(
        result.blob,
        result.filename || fallbackFilename,
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
        <Stack spacing={2.5}>
          <Typography
            id="ticket-export-dialog-description"
            variant="body2"
            color="text.secondary"
          >
            {TICKET_EXPORT_CONFIG.description}
          </Typography>

          <ToggleButtonGroup
            value={selectedPreset}
            exclusive
            onChange={handlePresetChange}
            aria-label="Ticket export date presets"
            size="small"
            sx={{
              flexWrap: "wrap",
              gap: 0.75,
              "& .MuiToggleButtonGroup-grouped": {
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                "&:not(:first-of-type)": {
                  borderLeft: 1,
                  borderColor: "divider",
                },
              },
            }}
          >
            {TICKET_EXPORT_CONFIG.presets.map((preset) => (
              <ToggleButton key={preset.key} value={preset.key}>
                {preset.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              required
              type="date"
              label={TICKET_EXPORT_CONFIG.fromDateLabel}
              value={range.fromDate}
              onChange={handleDateChange("fromDate")}
              error={Boolean(errors.fromDate)}
              helperText={errors.fromDate}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: today },
              }}
            />

            <TextField
              fullWidth
              required
              type="date"
              label={TICKET_EXPORT_CONFIG.toDateLabel}
              value={range.toDate}
              onChange={handleDateChange("toDate")}
              error={Boolean(errors.toDate)}
              helperText={errors.toDate}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: today },
              }}
            />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {TICKET_EXPORT_CONFIG.helperText}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isExporting}>
          {TICKET_EXPORT_CONFIG.cancelLabel}
        </Button>

        <Button
          variant="contained"
          startIcon={<DownloadOutlinedIcon />}
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
