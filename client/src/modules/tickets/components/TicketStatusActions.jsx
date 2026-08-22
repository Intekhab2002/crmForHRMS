import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";

const STATUS = {
  ASSIGNED: "ASSIGNED",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
};

export default function TicketStatusActions({
  ticket,
  config,
  onResolve,
  onClose,
  onReopen,
  loading = false,
}) {
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [error, setError] = useState("");

  if (!ticket || !config) {
    return null;
  }

  const handleResolve = async () => {
    setError("");

    if (
      config.resolve.requireResolutionNote &&
      !resolutionNote.trim()
    ) {
      setError("Resolution note is required.");
      return;
    }

    try {
      await onResolve(resolutionNote.trim());

      setResolutionNote("");
      setResolveDialogOpen(false);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError.message ??
          "Unable to resolve ticket.",
      );
    }
  };

  const handleClose = async () => {
    setError("");

    try {
      await onClose();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError.message ??
          "Unable to close ticket.",
      );
    }
  };

  const handleReopen = async () => {
    setError("");

    try {
      await onReopen();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError.message ??
          "Unable to reopen ticket.",
      );
    }
  };

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="flex-end"
      >
        {ticket.status === STATUS.ASSIGNED &&
        config.resolve.enabled ? (
          <Button
            variant="contained"
            startIcon={<CheckCircleOutlineOutlinedIcon />}
            onClick={() => setResolveDialogOpen(true)}
            disabled={loading}
          >
            {config.resolve.label}
          </Button>
        ) : null}

        {ticket.status === STATUS.RESOLVED &&
        config.close.enabled ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<LockOutlinedIcon />}
            onClick={handleClose}
            disabled={loading}
          >
            {config.close.label}
          </Button>
        ) : null}

        {ticket.status === STATUS.CLOSED &&
        config.reopen.enabled ? (
          <Button
            variant="outlined"
            startIcon={<ReplayOutlinedIcon />}
            onClick={handleReopen}
            disabled={loading}
          >
            {config.reopen.label}
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Dialog
        open={resolveDialogOpen}
        onClose={() => {
          if (!loading) {
            setResolveDialogOpen(false);
            setError("");
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Resolve Ticket</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Resolution note"
            placeholder="Describe how the issue was resolved."
            value={resolutionNote}
            onChange={(event) =>
              setResolutionNote(event.target.value)
            }
            error={Boolean(error)}
            helperText={
              error ||
              "Enter the resolution details before resolving the ticket."
            }
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setResolveDialogOpen(false);
              setError("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleResolve}
            disabled={loading}
          >
            Resolve Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}