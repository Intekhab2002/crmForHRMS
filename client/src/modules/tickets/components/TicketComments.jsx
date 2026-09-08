import {
  Avatar,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useState } from "react";

function getAuthorName(comment) {
  const author = comment?.author ?? {};

  return (
    author?.name ||
    [author?.firstName, author?.lastName].filter(Boolean).join(" ") ||
    "Unknown user"
  );
}
function getCommentInitials(name) {
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName) {
    return "?";
  }

  const parts = normalizedName.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isCommentEdited(comment) {
  if (!comment?.createdAt || !comment?.updatedAt) {
    return false;
  }

  const createdAt = new Date(comment.createdAt).getTime();
  const updatedAt = new Date(comment.updatedAt).getTime();

  if (Number.isNaN(createdAt) || Number.isNaN(updatedAt)) {
    return false;
  }

  return updatedAt > createdAt;
}

export default function TicketComments({
  comments = [],
  loading = false,
  currentUserId,
  onUpdateComment,
}) {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingCommentId, setSavingCommentId] = useState(null);

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditValue(comment.comment ?? "");
  };

  const handleCancelEdit = () => {
    if (savingCommentId) {
      return;
    }

    setEditingCommentId(null);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || savingCommentId || !onUpdateComment) {
      return;
    }

    const trimmedComment = editValue.trim();

    if (!trimmedComment) {
      return;
    }

    const originalComment = comments.find(
      (comment) => comment.id === editingCommentId,
    );

    if (!originalComment) {
      return;
    }

    if (trimmedComment === (originalComment.comment ?? "").trim()) {
      handleCancelEdit();
      return;
    }

    setSavingCommentId(editingCommentId);

    try {
      await onUpdateComment(editingCommentId, trimmedComment);

      setEditingCommentId(null);
      setEditValue("");
    } finally {
      setSavingCommentId(null);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <CommentOutlinedIcon color="action" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={800}>
            Comments
          </Typography>

          {!loading ? (
            <Typography variant="caption" color="text.secondary">
              ({comments.length})
            </Typography>
          ) : null}
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No comments yet.
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {comments.map((comment) => {
              const author = getAuthorName(comment);
              const canEdit =
                Boolean(currentUserId) && comment.userId === currentUserId;

              const isEditing = editingCommentId === comment.id;
              const isSaving = savingCommentId === comment.id;
              const edited = isCommentEdited(comment);

              return (
                <Stack
                  key={comment.id}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{
                    py: 1.25,
                    minWidth: 0,
                    "&:hover .comment-edit-action": {
                      opacity: canEdit && !isEditing ? 1 : 0,
                    },
                    "&:focus-within .comment-edit-action": {
                      opacity: canEdit && !isEditing ? 1 : 0,
                    },
                    "@media (pointer: coarse)": {
                      "& .comment-edit-action": {
                        opacity: canEdit && !isEditing ? 1 : 0.85,
                      },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    {getCommentInitials(author)}
                  </Avatar>

                  <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                    {isEditing ? (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          maxRows={8}
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          inputProps={{ maxLength: 5000 }}
                          autoFocus
                          disabled={isSaving}
                          helperText={`${editValue.length}/5000`}
                        />

                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<CloseOutlinedIcon />}
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            startIcon={
                              isSaving ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <SaveOutlinedIcon />
                              )
                            }
                            onClick={handleSaveEdit}
                            disabled={
                              isSaving ||
                              !editValue.trim() ||
                              editValue.trim() ===
                                (comment.comment ?? "").trim()
                            }
                          >
                            Save
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          lineHeight: 1.5,
                        }}
                      >
                        {comment.comment || ""}
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                      >
                        {author}
                      </Typography>

                      {comment.createdAt ? (
                        <Typography variant="caption" color="text.disabled">
                          • {formatDate(comment.createdAt)}
                        </Typography>
                      ) : null}

                      {edited ? (
                        <Typography variant="caption" color="text.disabled">
                          • Edited
                        </Typography>
                      ) : null}
                    </Stack>
                  </Stack>

                  {canEdit && !isEditing ? (
                    <Tooltip title="Edit comment">
                      <IconButton
                        className="comment-edit-action"
                        size="small"
                        onClick={() => handleStartEdit(comment)}
                        aria-label="Edit comment"
                        sx={{
                          opacity: 0,
                          transition: "opacity 120ms ease",
                          flexShrink: 0,
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
