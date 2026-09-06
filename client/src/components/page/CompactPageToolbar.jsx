import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

export default function CompactPageToolbar({
  title,
  description,
  backAction = null,
  backTooltip = "Back",
  refreshAction = null,
  actions = null,
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1, minWidth: 0 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ minWidth: 0 }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ minWidth: 0, flex: 1 }}
        >
          {backAction ? (
            <Tooltip title={backTooltip} arrow>
              <IconButton {...backAction} />
            </Tooltip>
          ) : null}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              noWrap
              sx={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>

            {description ? (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {description}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent="flex-end"
          flexWrap="wrap"
        >
          {actions}

          {refreshAction ? (
            <Tooltip title="Refresh ticket" arrow>
              <IconButton {...refreshAction} />
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
