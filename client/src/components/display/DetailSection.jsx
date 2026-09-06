import { Divider, Paper, Stack, Typography } from "@mui/material";

export default function DetailSection({
  title,
  action = null,
  children,
  sx,
  contentSx,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        minWidth: 0,
        ...sx,
      }}
    >
      {title || action ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          {title ? (
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ fontSize: "0.92rem", lineHeight: 1.25 }}
            >
              {title}
            </Typography>
          ) : (
            <span />
          )}

          {action}
        </Stack>
      ) : null}

      {title || action ? <Divider sx={{ mb: 1.25 }} /> : null}

      <Stack spacing={0} sx={{ minWidth: 0, ...contentSx }}>
        {children}
      </Stack>
    </Paper>
  );
}
