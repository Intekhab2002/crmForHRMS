//original
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

export default function CompactPageToolbar({
  title,
  description,
  backAction = null,
  backLabel = "Back",
  backTooltip = "Back to Tickets",
  refreshAction = null,
  actions = null,
  sx = null,
}) {
  return (
    <Paper
      // variant="outlined"
      sx={{
        p: 1,
        minWidth: 0,
        flexShrink: 0,
        marginY: 1,
        ...(sx ?? {}),
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ minWidth: 0 }}
      >
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ minWidth: 0, flex: 1 }}
        >
          {backAction ? (
            <Tooltip title={backTooltip} arrow>
              <span>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<ArrowBackOutlinedIcon />}
                  aria-label={backTooltip}
                  {...backAction}
                  sx={{
                    flexShrink: 0,
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    color: "text.secondary",
                  }}
                >
                  {backLabel}
                </Button>
              </span>
            </Tooltip>
          ) : null}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {title ? (
              <Typography
                variant="h6"
                fontWeight={700}
                color="text.primary"
                noWrap
                sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {description}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          justifyContent="flex-end"
          flexWrap="wrap"
          useFlexGap
        >
          {actions}

          {refreshAction ? (
            <Tooltip title="Refresh ticket" arrow>
              <IconButton
                {...refreshAction}
                aria-label={refreshAction["aria-label"] ?? "Refresh ticket"}
              >
                <RefreshOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
