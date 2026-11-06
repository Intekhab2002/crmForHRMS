import { Dialog, DialogContent, DialogTitle } from "@mui/material";

import TicketForm from "./TicketForm";
import { TICKET_FORM_CONFIG } from "../../../config/ticket.config";

export default function TicketCreateDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const handleClose = () => {
    if (!submitting) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="ticket-create-dialog-title"
    >
      <DialogTitle id="ticket-create-dialog-title">
        Create New Ticket
      </DialogTitle>

      <DialogContent dividers>
        <TicketForm
          mode="create"
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel={TICKET_FORM_CONFIG.create.submitLabel}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
