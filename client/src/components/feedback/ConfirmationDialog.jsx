import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export default function ConfirmationDialog({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "primary",
  onConfirm,
  onCancel,
  loading = false,
  disableConfirm = false,
  maxWidth = "xs",
}) {
  const handleCancel = () => {
    if (loading) {
      return;
    }

    onCancel?.();
  };

  const handleConfirm = () => {
    if (
      loading ||
      disableConfirm
    ) {
      return;
    }

    onConfirm?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="confirmation-dialog-description"
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>

        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant="contained"
          disabled={
            loading ||
            disableConfirm
          }
          autoFocus
        >
          {loading
            ? "Please wait..."
            : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}