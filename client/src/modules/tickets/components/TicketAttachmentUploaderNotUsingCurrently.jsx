import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CanAccess from "../../../components/rbac/CanAccess";
import { formatFileSize } from "../utils/ticketFormatters";

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getAttachmentName(attachment) {
  return (
    attachment.original_name ??
    attachment.originalName ??
    "Unnamed file"
  );
}

function getAttachmentSize(attachment) {
  return Number(
    attachment.file_size ??
      attachment.fileSize ??
      0,
  );
}

function getAttachmentMimeType(attachment) {
  return (
    attachment.mime_type ??
    attachment.mimeType ??
    "application/octet-stream"
  );
}

function getUploaderName(attachment) {
  return (
    attachment.username ??
    attachment.email ??
    "Unknown user"
  );
}

function getAttachmentDate(attachment) {
  return attachment.created_at ?? attachment.createdAt;
}

export default function TicketAttachmentUploader({
  config,
  attachments = [],
  loading = false,
  onSubmit,
}) {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const selectedFiles = useMemo(
    () => Array.from(files),
    [files],
  );

  const handleFileChange = (event) => {
    setError("");

    const selected = Array.from(
      event.target.files ?? [],
    );

    setFiles(selected);
  };

  const clearSelectedFiles = () => {
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFiles.length || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      await onSubmit(
        selectedFiles,
        (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const progress = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total,
          );

          setUploadProgress(progress);
        },
      );

      clearSelectedFiles();
      setUploadProgress(100);
    } catch (uploadError) {
      setError(
        uploadError?.response?.data?.message ??
          uploadError?.message ??
          "Unable to upload attachment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CanAccess permission={config.permission}>
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
            spacing={1.5}
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 1.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.default",
            }}
          >
            <AttachFileOutlinedIcon
              color="primary"
              fontSize="small"
            />

            <Stack spacing={0.25}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
              >
                {config.title}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Upload and manage files associated with this ticket.
              </Typography>
            </Stack>

            {!loading ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: "auto" }}
              >
                {attachments.length}{" "}
                {attachments.length === 1
                  ? "file"
                  : "files"}
              </Typography>
            ) : null}
          </Stack>

          <Stack
            spacing={2}
            sx={{
              p: { xs: 2, md: 2.5 },
            }}
          >
            {error ? (
              <Alert
                severity="error"
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            ) : null}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
            >
              <Button
                variant="outlined"
                component="label"
                startIcon={
                  <AttachFileOutlinedIcon />
                }
                disabled={isSubmitting}
              >
                {config.selectLabel}

                <input
                  ref={fileInputRef}
                  hidden
                  multiple
                  type="file"
                  onChange={handleFileChange}
                />
              </Button>

              <Button
                variant="contained"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <CloudUploadOutlinedIcon />
                  )
                }
                disabled={
                  !selectedFiles.length ||
                  isSubmitting
                }
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? "Uploading..."
                  : config.uploadLabel}
              </Button>

              {selectedFiles.length ? (
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={
                    <ClearOutlinedIcon />
                  }
                  disabled={isSubmitting}
                  onClick={clearSelectedFiles}
                >
                  Clear
                </Button>
              ) : null}
            </Stack>

            {isSubmitting ? (
              <Stack spacing={0.75}>
                <LinearProgress
                  variant={
                    uploadProgress > 0
                      ? "determinate"
                      : "indeterminate"
                  }
                  value={uploadProgress}
                />

                {uploadProgress > 0 ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="right"
                  >
                    {uploadProgress}%
                  </Typography>
                ) : null}
              </Stack>
            ) : null}

            {selectedFiles.length ? (
              <Stack spacing={1}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                >
                  Selected files
                </Typography>

                <List
                  dense
                  disablePadding
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                  }}
                >
                  {selectedFiles.map((file) => (
                    <ListItem
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      disableGutters
                      sx={{
                        px: 1.5,
                        py: 0.75,
                      }}
                    >
                      <InsertDriveFileOutlinedIcon
                        fontSize="small"
                        color="action"
                        sx={{ mr: 1.25 }}
                      />

                      <ListItemText
                        primary={file.name}
                        secondary={`${file.type || "Unknown type"} · ${formatFileSize(file.size)}`}
                        primaryTypographyProps={{
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{
                          noWrap: true,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            ) : null}

            <Divider />

            <Stack spacing={1}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Uploaded files
              </Typography>

              {loading ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ py: 3 }}
                >
                  <CircularProgress size={28} />
                </Stack>
              ) : attachments.length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ py: 1 }}
                >
                  No attachments yet.
                </Typography>
              ) : (
                <List
                  disablePadding
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    overflow: "hidden",
                  }}
                >
                  {attachments.map((attachment, index) => {
                    const name =
                      getAttachmentName(
                        attachment,
                      );
                    const size =
                      getAttachmentSize(
                        attachment,
                      );
                    const mimeType =
                      getAttachmentMimeType(
                        attachment,
                      );
                    const uploader =
                      getUploaderName(
                        attachment,
                      );
                    const createdAt =
                      getAttachmentDate(
                        attachment,
                      );

                    return (
                      <ListItem
                        key={attachment.id}
                        divider={
                          index <
                          attachments.length - 1
                        }
                        sx={{
                          px: 1.5,
                          py: 1.25,
                        }}
                        secondaryAction={
                          <Tooltip title="Download will be enabled when the backend download route is exposed">
                            <span>
                              <IconButton
                                disabled
                                size="small"
                                aria-label={`Download ${name}`}
                              >
                                <CloudUploadOutlinedIcon
                                  fontSize="small"
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                        }
                      >
                        <InsertDriveFileOutlinedIcon
                          color="action"
                          sx={{ mr: 1.5 }}
                        />

                        <ListItemText
                          primary={name}
                          secondary={
                            <Stack
                              component="span"
                              spacing={0.25}
                            >
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                {mimeType} ·{" "}
                                {formatFileSize(
                                  size,
                                )}
                              </Typography>

                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                Uploaded by{" "}
                                {uploader}
                                {createdAt
                                  ? ` · ${formatDate(createdAt)}`
                                  : ""}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </CanAccess>
  );
}