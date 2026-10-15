import { Alert, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CanAccess from "../../../components/rbac/CanAccess";
import { TICKET_MODULE_CONFIG } from "../../../config/ticket.config";

export default function TicketQuickUpdate({
  currentStatus,
  pendingStatus,
  statusOptions = [],
  statusOptionsLoading = false,
  saving = false,
  onStatusChange,
  onSave,
}) {
  const hasChange = Boolean(pendingStatus) && pendingStatus !== currentStatus;
  const currentLabel = statusOptions.find((option) => option.value === currentStatus)?.label ?? currentStatus ?? "Not set";

  return (
    <Stack spacing={2} className="ticket-quick-update">
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">Current status</Typography>
        <Typography variant="body1" fontWeight={600}>{currentLabel}</Typography>
      </Stack>
      <CanAccess permission={TICKET_MODULE_CONFIG.permissions.update}>
      <Stack spacing={1} sx={{ minWidth: 0 }}>
        <FormControl size="small" fullWidth disabled={saving || statusOptionsLoading}>
          <InputLabel id="ticket-quick-update-status-label">New status</InputLabel>
          <Select
            labelId="ticket-quick-update-status-label"
            id="ticket-quick-update-status"
            label="New status"
            value={pendingStatus ?? ""}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={onSave}
          disabled={saving || statusOptionsLoading || !hasChange}
        >
          {saving ? "Saving…" : "Save status"}
        </Button>
      </Stack>
      </CanAccess>
      {statusOptionsLoading ? <Alert severity="info">Loading available statuses…</Alert> : null}
    </Stack>
  );
}
