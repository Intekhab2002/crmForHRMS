import  { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import CanAccess from "../../../components/rbac/CanAccess";

export default function TicketCommentComposer({
  config,
  onSubmit,
}) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!comment.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(comment.trim());
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CanAccess permission={config.permission}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Typography variant="h6" fontWeight={800}>
            {config.title}
          </Typography>
          <TextField
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={config.placeholder}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddCommentOutlinedIcon />}
              disabled={isSubmitting || !comment.trim()}
            >
              {config.submitLabel}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </CanAccess>
  );
}
