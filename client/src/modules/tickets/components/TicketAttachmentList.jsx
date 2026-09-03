import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";

import CanAccess from "../../../components/rbac/CanAccess";

import { ticketService } from "../services/ticket.service";

import TicketAttachmentViewer from "./TicketAttachmentViewer";

import {
  formatAttachmentDate,
  formatFileSize,
  isImageAttachment,
  isPdfAttachment,
} from "../utils/attachment.utils";
import { TICKET_MODULE_CONFIG } from "../../../config/ticket.config";

function AttachmentIcon({ attachment }) {
  if (isImageAttachment(attachment)) {
    return <ImageOutlinedIcon color="primary" />;
  }

  if (isPdfAttachment(attachment)) {
    return <PictureAsPdfOutlinedIcon color="error" />;
  }

  return <InsertDriveFileOutlinedIcon color="action" />;
}

function getDownloadFilename(contentDisposition, fallback) {
  if (!contentDisposition) {
    return fallback;
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  return filenameMatch?.[1] || fallback;
}

export default function TicketAttachmentList({ ticketId }) {
  const inputRef = useRef(null);

  const [attachments, setAttachments] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isUploading, setIsUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const { attachment: attachmentPermissions } =
    TICKET_MODULE_CONFIG.permissions;

  const loadAttachments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await ticketService.listAttachments(ticketId);

      setAttachments(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Failed to load ticket attachments:", loadError);

      setError(
        loadError.response?.data?.message || "Unable to load attachments.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    loadAttachments();
  }, [ticketId]);

  const handleSelectFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (!files.length) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");

    try {
      for (const file of files) {
        await ticketService.uploadAttachment(
          ticketId,
          file,
          (progressEvent) => {
            if (!progressEvent.total) {
              return;
            }

            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100,
            );

            setUploadProgress(progress);
          },
        );
      }

      await loadAttachments();

      setSuccess(
        files.length === 1
          ? "Attachment uploaded successfully."
          : `${files.length} attachments uploaded successfully.`,
      );
    } catch (uploadError) {
      console.error("Attachment upload failed:", uploadError);

      setError(
        uploadError.response?.data?.message || "Unable to upload attachment.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      setError("");

      const result = await ticketService.downloadAttachment(
        ticketId,
        attachment.id,
      );

      const filename = getDownloadFilename(
        result.contentDisposition,
        attachment.original_name,
      );

      const url = URL.createObjectURL(result.blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = filename;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error("Attachment download failed:", downloadError);

      setError(
        downloadError.response?.data?.message ||
          "Unable to download attachment.",
      );
    }
  };

  const handleDelete = async (attachment) => {
    const confirmed = window.confirm(`Delete "${attachment.original_name}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(attachment.id);
    setError("");
    setSuccess("");

    try {
      await ticketService.deleteAttachment(ticketId, attachment.id);

      setAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );

      setSuccess("Attachment deleted successfully.");
    } catch (deleteError) {
      console.error("Attachment deletion failed:", deleteError);

      setError(
        deleteError.response?.data?.message || "Unable to delete attachment.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (attachment) => {
    setSelectedAttachment(attachment);

    setIsViewerOpen(true);
  };

  return (
    <CanAccess permission={attachmentPermissions.read}>
      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        <Stack spacing={0}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              px: {
                xs: 2,
                md: 2.5,
              },
              py: 1.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.default",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <AttachFileOutlinedIcon color="primary" />

              <Stack spacing={0.25}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Attachments
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {attachments.length}{" "}
                  {attachments.length === 1 ? "file" : "files"}
                </Typography>
              </Stack>
            </Stack>

            <CanAccess permission={attachmentPermissions.create}>
              <input
                ref={inputRef}
                hidden
                type="file"
                multiple
                onChange={handleSelectFiles}
              />

              <Button
                variant="contained"
                size="small"
                startIcon={<AttachFileOutlinedIcon />}
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </CanAccess>
          </Stack>

          {isUploading && (
            <Box>
              <LinearProgress variant="determinate" value={uploadProgress} />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  px: 2.5,
                  py: 0.75,
                }}
              >
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Stack
            spacing={1}
            sx={{
              p: {
                xs: 1.5,
                md: 2,
              },
            }}
          >
            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess("")}>
                {success}
              </Alert>
            )}

            {isLoading ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  py: 6,
                }}
              >
                <CircularProgress size={28} />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1.5,
                  }}
                >
                  Loading attachments...
                </Typography>
              </Stack>
            ) : attachments.length === 0 ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{
                  py: 6,
                  textAlign: "center",
                }}
              >
                <AttachFileOutlinedIcon
                  sx={{
                    fontSize: 40,
                    color: "text.disabled",
                  }}
                />

                <Typography variant="body2" fontWeight={600}>
                  No attachments yet
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Upload documents or images related to this ticket.
                </Typography>
              </Stack>
            ) : (
              attachments.map((attachment) => (
                <Paper
                  key={attachment.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                  }}
                >
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    alignItems={{
                      xs: "stretch",
                      sm: "center",
                    }}
                    spacing={1.5}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        borderRadius: 1.5,
                        backgroundColor: "action.hover",
                      }}
                    >
                      <AttachmentIcon attachment={attachment} />
                    </Box>

                    <Stack
                      spacing={0.35}
                      sx={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {attachment.original_name}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {attachment.mime_type || "Unknown type"} ·{" "}
                        {formatFileSize(attachment.file_size)} ·{" "}
                        {formatAttachmentDate(attachment.created_at)}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => handleView(attachment)}
                          aria-label={`View ${attachment.original_name}`}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(attachment)}
                          aria-label={`Download ${attachment.original_name}`}
                        >
                          <DownloadOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <CanAccess permission={attachmentPermissions.delete}>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={deletingId === attachment.id}
                              onClick={() => handleDelete(attachment)}
                              aria-label={`Delete ${attachment.original_name}`}
                            >
                              {deletingId === attachment.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </CanAccess>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </Stack>
      </Paper>

      {selectedAttachment && (
        <TicketAttachmentViewer
          open={isViewerOpen}
          ticketId={ticketId}
          attachment={selectedAttachment}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedAttachment(null);
          }}
        />
      )}
    </CanAccess>
  );
}
