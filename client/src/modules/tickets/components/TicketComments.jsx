// Hi I am original
import {
  Avatar,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";

function getAuthorName(comment) {
  const author = comment?.author ?? {};

  return (
    author?.name ||
    [author?.firstName, author?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unknown user"
  );
}
function getCommentInitials(name) {
  const normalizedName =
    typeof name === "string"
      ? name.trim()
      : "";

  if (!normalizedName) {
    return "?";
  }

  const parts = normalizedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
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

export default function TicketComments({ comments = [], loading = false }) {
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

              return (
                <Stack
                  key={comment.id}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{ py: 1.25, minWidth: 0 }}
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

                  <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
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
                    </Stack>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
