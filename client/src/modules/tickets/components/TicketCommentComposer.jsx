import { useState } from "react";
import {
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import CanAccess from "../../../components/rbac/CanAccess";

export default function TicketCommentComposer({
  config,
  onSubmit,
}) {
  console.log("TicketCommentComposer config:", config);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedComment = comment.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!trimmedComment || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(trimmedComment);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();

      if (trimmedComment && !isSubmitting) {
        event.currentTarget.form?.requestSubmit();
      }
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
        <Stack
          component="form"
          onSubmit={handleSubmit}
          spacing={0}
        >
          {/* Header */}
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
            <AddCommentOutlinedIcon
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
                Add an update or note to this ticket.
              </Typography>
            </Stack>
          </Stack>

          {/* Composer */}
          <Stack
            spacing={1}
            sx={{
              p: { xs: 2, md: 2.5 },
            }}
          >
            <TextField
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              multiline
              minRows={4}
              maxRows={10}
              fullWidth
              autoComplete="off"
              disabled={isSubmitting}
              inputProps={{
                maxLength: 5000,
              }}
              helperText={
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  component="span"
                >
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    Press Ctrl + Enter to add comment
                  </Typography>

                  <Typography
                    component="span"
                    variant="caption"
                    color={
                      comment.length >= 5000
                        ? "error"
                        : "text.secondary"
                    }
                  >
                    {comment.length}/5000
                  </Typography>
                </Stack>
              }
            />

            {/* Actions */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={1}
              sx={{ pt: 0.5 }}
            >
              <Button
                type="button"
                variant="text"
                color="inherit"
                disabled={isSubmitting || !comment}
                onClick={() => setComment("")}
              >
                Clear
              </Button>

              <Button
                type="submit"
                variant="contained"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <AddCommentOutlinedIcon />
                  )
                }
                disabled={isSubmitting || !trimmedComment}
                sx={{
                  minWidth: 145,
                }}
              >
                {isSubmitting ? "Adding..." : config.submitLabel}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </CanAccess>
  );
}