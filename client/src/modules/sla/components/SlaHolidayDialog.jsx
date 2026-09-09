import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField,
} from "@mui/material";

export default function SlaHolidayDialog({ open, holiday, onClose, onSave, saving = false }) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setDate(holiday?.holiday_date ?? "");
    setName(holiday?.name ?? "");
  }, [holiday, open]);

  const submit = (event) => {
    event.preventDefault();
    onSave({ holidayDate: date, name: name.trim(), isActive: true });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit}>
        <DialogTitle>{holiday ? "Edit holiday" : "Add holiday"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField required fullWidth type="date" label="Date" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField required fullWidth label="Holiday name" value={name} onChange={(event) => setName(event.target.value)} inputProps={{ maxLength: 200 }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || !date || !name.trim()}>
            {saving ? "Saving…" : "Save holiday"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
