import { useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

function SlaHolidayForm({
  holiday,
  initialDate,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
  canDelete,
}) {
  const [date, setDate] = useState(holiday?.holiday_date ?? initialDate ?? "");

  const [name, setName] = useState(holiday?.name ?? "");

  const submit = (event) => {
    event.preventDefault();

    onSave({
      holidayDate: date,
      name: name.trim(),
      isActive: true,
    });
  };

  const busy = saving || deleting;

  return (
    <form onSubmit={submit}>
      <DialogTitle>{holiday ? "Edit holiday" : "Add holiday"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            required
            fullWidth
            type="date"
            label="Date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            required
            fullWidth
            label="Holiday name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: 200 }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        {holiday && canDelete ? (
          <Button
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => onDelete?.(holiday)}
            disabled={busy}
            sx={{ mr: "auto" }}
          >
            {deleting ? "Removing…" : "Remove"}
          </Button>
        ) : null}

        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={busy || !date || !name.trim()}
        >
          {saving ? "Saving…" : "Save holiday"}
        </Button>
      </DialogActions>
    </form>
  );
}

export default SlaHolidayForm;
