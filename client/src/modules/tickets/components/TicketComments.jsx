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
  return comment.username || comment.email || "Unknown user";
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

export default function TicketComments({
  comments = [],
  loading = false,
}) {
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
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <CommentOutlinedIcon color="action" />

          <Typography
            variant="h6"
            fontWeight={800}
          >
            Comments
          </Typography>

          {!loading ? (
            <Typography color="text.secondary">
              ({comments.length})
            </Typography>
          ) : null}
        </Stack>

        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 4 }}
          >
            <CircularProgress size={28} />
          </Stack>
        ) : comments.length === 0 ? (
          <Typography color="text.secondary">
            No comments yet.
          </Typography>
        ) : (
          <Stack
            divider={<Divider flexItem />}
            spacing={0}
          >
            {comments.map((comment) => {
              const author = getAuthorName(comment);

              return (
                <Stack
                  key={comment.id}
                  direction="row"
                  spacing={1.5}
                  sx={{ py: 2 }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                    }}
                  >
                    {author
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>

                  <Stack
                    spacing={0.5}
                    sx={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={{
                        xs: 0,
                        sm: 1,
                      }}
                      alignItems={{
                        xs: "flex-start",
                        sm: "baseline",
                      }}
                    >
                      <Typography fontWeight={700}>
                        {author}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDate(
                          comment.created_at,
                        )}
                      </Typography>
                    </Stack>

                    {comment.email &&
                    comment.username ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {comment.email}
                      </Typography>
                    ) : null}

                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        mt: 0.5,
                      }}
                    >
                      {comment.comment}
                    </Typography>
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