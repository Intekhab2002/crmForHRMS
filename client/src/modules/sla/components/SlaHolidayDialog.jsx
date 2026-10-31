import { Dialog } from "@mui/material";
import SlaHolidayForm from "./SlaHolidayForm";

export default function SlaHolidayDialog({
  open,
  holiday,
  initialDate = "",
  onClose,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
  canDelete = false,
}) {
  const busy = saving || deleting;

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      {open ? (
        <SlaHolidayForm
          key={`${holiday?.id ?? "new"}-${initialDate}`}
          holiday={holiday}
          initialDate={initialDate}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          saving={saving}
          deleting={deleting}
          canDelete={canDelete}
        />
      ) : null}
    </Dialog>
  );
}
