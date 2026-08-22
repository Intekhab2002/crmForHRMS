import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import { ticketService } from "../services/ticket.service";
import {
  isImageAttachment,
  isPdfAttachment,
  isTextAttachment,
} from "../utils/attachment.utils";

function getBlobUrl(blob) {
  return URL.createObjectURL(blob);
}

export default function TicketAttachmentViewer({
  open,
  ticketId,
  attachment,
  onClose,
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !ticketId || !attachment) {
      return undefined;
    }

    let objectUrl = "";

    const loadPreview = async () => {
      setIsLoading(true);
      setError("");
      setPreviewUrl("");
      setPreviewText("");

      try {
        const blob =
          await ticketService.viewAttachment(
            ticketId,
            attachment.id,
          );

        if (isTextAttachment(attachment)) {
          const text = await blob.text();

          setPreviewText(text);
          return;
        }

        objectUrl = getBlobUrl(blob);
        setPreviewUrl(objectUrl);
      } catch (previewError) {
        console.error(
          "Failed to load attachment preview:",
          previewError,
        );

        setError(
          previewError.response?.data?.message ||
            "Unable to preview this attachment.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    open,
    ticketId,
    attachment,
  ]);

  const handleClose = () => {
    setPreviewUrl("");
    setPreviewText("");
    setError("");
    onClose();
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            minHeight: 400,
          }}
          spacing={2}
        >
          <CircularProgress />
          <Typography color="text.secondary">
            Loading preview...
          </Typography>
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }

    if (isImageAttachment(attachment)) {
      return (
        <Box
          component="img"
          src={previewUrl}
          alt={attachment.original_name}
          sx={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "70vh",
            width: "auto",
            height: "auto",
            mx: "auto",
            objectFit: "contain",
            borderRadius: 1,
          }}
        />
      );
    }

    if (isPdfAttachment(attachment)) {
      return (
        <Box
          component="iframe"
          src={previewUrl}
          title={attachment.original_name}
          sx={{
            width: "100%",
            height: "70vh",
            border: 0,
            borderRadius: 1,
          }}
        />
      );
    }

    if (isTextAttachment(attachment)) {
      return (
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            maxHeight: "70vh",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 13,
            backgroundColor: "background.default",
            borderRadius: 1,
          }}
        >
          {previewText}
        </Box>
      );
    }

    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{
          minHeight: 300,
          textAlign: "center",
        }}
      >
        <DescriptionOutlinedIcon
          sx={{
            fontSize: 56,
            color: "text.secondary",
          }}
        />

        <Typography variant="h6">
          Preview not available
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          This file type cannot be previewed directly
          in the browser.
        </Typography>
      </Stack>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle
        sx={{
          pr: 7,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          noWrap
        >
          {attachment?.original_name}
        </Typography>

        <IconButton
          aria-label="Close preview"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          minHeight: 300,
        }}
      >
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
}