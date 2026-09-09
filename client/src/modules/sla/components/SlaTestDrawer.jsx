import { useEffect, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Drawer, Stack, TextField, Typography,
} from "@mui/material";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import IconButton from "@mui/material/IconButton";
import slaApi from "../services/sla.api";
import { SLA_FIELDS } from "../config/sla.config";
import { formatDateTime, formatDurationMinutes } from "../utils/slaFormatters";

export default function SlaTestDrawer({ open, onClose, calendarId }) {
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [durationMinutes, setDurationMinutes] = useState(480);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setResult(null);
      setError("");
    }
  }, [open]);

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await slaApi.preview({
        startAt: new Date(startAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        calendarId,
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Unable to calculate preview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 440 } } }}>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Test SLA calculation</Typography>
            <Typography variant="body2" color="text.secondary">Preview business-time behavior before activating a policy.</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close SLA preview"><CloseOutlinedIcon /></IconButton>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField
          fullWidth
          type="datetime-local"
          label="Start"
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          type="number"
          label="Duration in minutes"
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          inputProps={{ min: 1, step: 1 }}
          helperText={formatDurationMinutes(Number(durationMinutes))}
        />
        <Button
          variant="contained"
          startIcon={<CalculateOutlinedIcon />}
          onClick={calculate}
          disabled={!calendarId || loading || Number(durationMinutes) < 1}
        >
          {loading ? "Calculating…" : "Calculate"}
        </Button>
        {result ? (
          <Box component="section" aria-label="SLA preview result" sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography variant="overline" color="text.secondary">Expected target</Typography>
            <Typography variant="h6">{formatDateTime(result.targetAt)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Business duration: {formatDurationMinutes(result.businessMinutes ?? durationMinutes)}
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </Drawer>
  );
}
