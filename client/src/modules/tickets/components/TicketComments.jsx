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
  console.log("GetAuthorName Function",author)

  return (
    author?.name ||
    [author?.firstName, author?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unknown user"
  );
}
function getCommentInitials(comment) {
  const name = getAuthorName(comment);

  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "?";
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase())
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
  console.log("TicketComments", comments);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CommentOutlinedIcon color="action" />

          <Typography variant="h6" fontWeight={800}>
            Comments
          </Typography>

          {!loading ? (
            <Typography color="text.secondary">({comments.length})</Typography>
          ) : null}
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : comments.length === 0 ? (
          <Typography color="text.secondary">No comments yet.</Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {comments.map((comment) => {
              const author = getAuthorName(comment);

              return (
                <Stack
                  key={comment.id}
                  direction="row"
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  alignItems="flex-start"
                  sx={{
                    py: 2,
                    minWidth: 0,
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      flexShrink: 0,
                    }}
                  >
                    {getCommentInitials(author)}
                  </Avatar>

                  <Stack
                    spacing={0.75}
                    sx={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {/* PRIMARY CONTENT */}
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        lineHeight: 1.65,
                      }}
                    >
                      {comment.comment || ""}
                    </Typography>

                    {/* METADATA */}
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{ minWidth: 0 }}
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

                      {comment.author?.email ? (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{
                            overflowWrap: "anywhere",
                          }}
                        >
                          • {comment.author.email}
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
