import  { useMemo, useRef, useState } from "react";
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CanAccess from "../../../components/rbac/CanAccess";
import { formatFileSize } from "../utils/ticketFormatters";

export default function TicketAttachmentUploader({
  config,
  attachments = [],
  onSubmit,
}) {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFiles = useMemo(() => Array.from(files), [files]);

  const handleSubmit = async () => {
    if (!selectedFiles.length) return;

    setIsSubmitting(true);

    try {
      await onSubmit(selectedFiles);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CanAccess permission={config.permission}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={800}>
            {config.title}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileOutlinedIcon />}
            >
              {config.selectLabel}
              <input
                ref={fileInputRef}
                hidden
                multiple
                type="file"
                onChange={(event) => setFiles(event.target.files ?? [])}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadOutlinedIcon />}
              disabled={!selectedFiles.length || isSubmitting}
              onClick={handleSubmit}
            >
              {config.uploadLabel}
            </Button>
          </Stack>

          {selectedFiles.length ? (
            <List dense disablePadding>
              {selectedFiles.map((file) => (
                <ListItem key={`${file.name}-${file.size}`} disableGutters>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                </ListItem>
              ))}
            </List>
          ) : null}

          {attachments.length ? (
            <List dense disablePadding>
              {attachments.map((attachment) => (
                <ListItem key={attachment.id} disableGutters>
                  <ListItemText
                    primary={attachment.name}
                    secondary={`${formatFileSize(attachment.size)} uploaded by ${
                      attachment.uploadedBy?.name ?? "System"
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          ) : null}
        </Stack>
      </Paper>
    </CanAccess>
  );
}
