import { Alert, Dialog, DialogContent, DialogTitle } from "@mui/material";
import TicketForm from "./TicketForm";
import { TICKET_FORM_CONFIG } from "../../../config/ticket.config";

export default function TicketCreateDialog({ open, onClose, onSubmit, submitting = false, error = "" }) {
  return (
    <Dialog
      open={open}
      onClose={() => { if (!submitting) onClose(); }}
      fullWidth
      maxWidth="lg"
      aria-labelledby="ticket-create-dialog-title"
    >
      <DialogTitle id="ticket-create-dialog-title">Create New Ticket</DialogTitle>
      <DialogContent dividers>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <TicketForm
          mode="create"
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel={TICKET_FORM_CONFIG.create.submitLabel}
          onCancel={() => { if (!submitting) onClose(); }}
        />
      </DialogContent>
    </Dialog>
  );
}
