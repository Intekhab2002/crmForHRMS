
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";

function PanelAction({ title, label, onClick, disabled = false, children }) {
  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size="small"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function WorkspacePanel({ panel, onModeChange }) {
  const collapsed = panel.mode === "collapsed";
  const full = panel.mode === "full";
  const quickUpdate = panel.id === "ticket-quick-update";

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label={panel.title}
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: {
          xs: collapsed ? 0 : quickUpdate ? 0 : "18rem",
          md: collapsed ? 0 : quickUpdate ? "8rem" : "22rem",
        },
        height: {
          xs: "auto",
          md: collapsed
            ? "auto"
            : quickUpdate
              ? "auto"
              : "clamp(38rem, 60vh, 46rem)",
        },
        maxHeight: {
          xs: "none",
          md: quickUpdate || collapsed ? "none" : "46rem",
        },
        width: collapsed ? { xs: "100%", md: "4rem" } : "100%",
        minWidth: collapsed ? { xs: 0, md: "4rem" } : 0,
        overflow: "hidden",
        borderRadius: 3,
        gridColumn: {
          xs: "1 / -1",
          md: full || (quickUpdate && panel.spanWorkspace)
            ? "1 / -1"
            : "auto",
        },
      }}
    >
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? { xs: "space-between", md: "center" } : "space-between"}
        spacing={1}
        sx={{
          flex: "0 0 auto",
          minWidth: 0,
          minHeight: "3.5rem",
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {collapsed ? (
          <>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Tooltip title={panel.title} placement="right" arrow>
                <Box
                  component="span"
                  aria-label={panel.title}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    color: "primary.main",
                  }}
                >
                  {panel.icon}
                </Box>
              </Tooltip>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ display: { xs: "block", md: "none" } }}
              >
                {panel.title}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "row", md: "column" }}
              spacing={0.5}
              alignItems="center"
            >
              <PanelAction
                title={`Expand ${panel.title} to half width`}
                label={`Expand ${panel.title} to half width`}
                onClick={() => onModeChange(panel.id, "half")}
              >
                <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" />
              </PanelAction>
              <PanelAction
                title={`Expand ${panel.title} to full width`}
                label={`Expand ${panel.title} to full width`}
                onClick={() => onModeChange(panel.id, "full")}
              >
                <OpenInFullOutlinedIcon fontSize="small" />
              </PanelAction>
            </Stack>
          </>
        ) : (
          <>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ minWidth: 0 }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                  color: "primary.main",
                }}
              >
                {panel.icon}
              </Box>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {panel.title}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.25} alignItems="center">
              <PanelAction
                title="Use half width"
                label={`Use half width for ${panel.title}`}
                disabled={panel.mode === "half"}
                onClick={() => onModeChange(panel.id, "half")}
              >
                <ViewColumnOutlinedIcon fontSize="small" />
              </PanelAction>
              <PanelAction
                title="Expand to full width"
                label={`Expand ${panel.title} to full width`}
                disabled={full}
                onClick={() => onModeChange(panel.id, "full")}
              >
                <OpenInFullOutlinedIcon fontSize="small" />
              </PanelAction>
              <PanelAction
                title="Collapse to icon rail"
                label={`Collapse ${panel.title}`}
                onClick={() => onModeChange(panel.id, "collapsed")}
              >
                <KeyboardDoubleArrowLeftOutlinedIcon fontSize="small" />
              </PanelAction>
            </Stack>
          </>
        )}
      </Stack>

      {!collapsed && (
        <Box
          sx={{
            display: "flex",
            flex: "1 1 0%",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {panel.content}
        </Box>
      )}
    </Paper>
  );
}

export default function TicketDetailsWorkspace({
  layout,
  onPanelModeChange,
  panels = [],
}) {
  const detailsMode = layout.panels["ticket-details"];
  const lifecycleMode = layout.panels["ticket-lifecycle"];

  const bothUpperPanelsCollapsed =
    detailsMode === "collapsed" && lifecycleMode === "collapsed";

  let gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";

  if (bothUpperPanelsCollapsed) {
    gridTemplateColumns = "4rem 4rem minmax(0, 1fr)";
  } else if (detailsMode === "collapsed") {
    gridTemplateColumns = "4rem minmax(0, 1fr)";
  } else if (lifecycleMode === "collapsed") {
    gridTemplateColumns = "minmax(0, 1fr) 4rem";
  }

  const orderedPanels = [...panels].sort((a, b) => {
    if (a.id === "ticket-quick-update") return 1;
    if (b.id === "ticket-quick-update") return -1;
    if (a.mode === "full" && b.mode !== "full") return -1;
    if (b.mode === "full" && a.mode !== "full") return 1;
    return 0;
  });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: gridTemplateColumns,
        },
        alignItems: "stretch",
        gap: 2,
        width: "100%",
        minWidth: 0,
      }}
    >
      {orderedPanels.map((panel) => (
        <WorkspacePanel
          key={panel.id}
          panel={{
            ...panel,
            spanWorkspace:
              panel.id === "ticket-quick-update" &&
              bothUpperPanelsCollapsed,
          }}
          onModeChange={onPanelModeChange}
        />
      ))}
    </Box>
  );
}
