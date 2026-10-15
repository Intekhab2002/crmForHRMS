import { IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import "./TicketDetailsWorkspace.css";

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

  return (
    <Paper
      component="section"
      variant="outlined"
      className={"ticket-workspace-panel ticket-workspace-panel--" + panel.mode}
      data-panel-id={panel.id}
      aria-label={panel.title}
    >
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? "center" : "space-between"}
        spacing={1}
        className="ticket-workspace-panel__header"
      >
        {collapsed ? (
          <Stack spacing={0.5} alignItems="center">
            <Tooltip title={panel.title} placement="right" arrow>
              <span
                className="ticket-workspace-panel__collapsed-icon"
                aria-label={panel.title}
              >
                {panel.icon}
              </span>
            </Tooltip>
            <PanelAction
              title={"Expand " + panel.title + " to half width"}
              label={"Expand " + panel.title + " to half width"}
              onClick={() => onModeChange(panel.id, "half")}
            >
              <KeyboardDoubleArrowRightOutlinedIcon fontSize="small" />
            </PanelAction>
            <PanelAction
              title={"Expand " + panel.title + " to full width"}
              label={"Expand " + panel.title + " to full width"}
              onClick={() => onModeChange(panel.id, "full")}
            >
              <OpenInFullOutlinedIcon fontSize="small" />
            </PanelAction>
          </Stack>
        ) : (
          <>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ minWidth: 0 }}
            >
              <span
                className="ticket-workspace-panel__title-icon"
                aria-hidden="true"
              >
                {panel.icon}
              </span>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {panel.title}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.25} alignItems="center">
              <PanelAction
                title="Use half width"
                label={"Use half width for " + panel.title}
                disabled={panel.mode === "half"}
                onClick={() => onModeChange(panel.id, "half")}
              >
                <ViewColumnOutlinedIcon fontSize="small" />
              </PanelAction>
              <PanelAction
                title="Expand to full width"
                label={"Expand " + panel.title + " to full width"}
                disabled={panel.mode === "full"}
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
      {!collapsed ? (
        <div className="ticket-workspace-panel__body">{panel.content}</div>
      ) : null}
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
  let gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";

  const bothUpperPanelsCollapsed =
    detailsMode === "collapsed" && lifecycleMode === "collapsed";

  if (bothUpperPanelsCollapsed) {
    // Two compact rails plus a flexible track for the workspace.
    gridTemplateColumns = "64px 64px minmax(0, 1fr)";
  } else if (detailsMode === "collapsed") {
    gridTemplateColumns = "64px minmax(0, 1fr)";
  } else if (lifecycleMode === "collapsed") {
    gridTemplateColumns = "minmax(0, 1fr) 64px";
  }

  // if (detailsMode === "collapsed" && lifecycleMode === "collapsed") {
  //   gridTemplateColumns = "64px 64px";
  // } else if (detailsMode === "collapsed") {
  //   gridTemplateColumns = "64px minmax(0, 1fr)";
  // } else if (lifecycleMode === "collapsed") {
  //   gridTemplateColumns = "minmax(0, 1fr) 64px";
  // }

  const orderedPanels = [...panels].sort((a, b) => {
    if (a.id === "ticket-quick-update") return 1;
    if (b.id === "ticket-quick-update") return -1;
    if (a.mode === "full" && b.mode !== "full") return -1;
    if (b.mode === "full" && a.mode !== "full") return 1;
    return 0;
  });

  return (
    <div
      className={
        "ticket-details-workspace" +
        (bothUpperPanelsCollapsed
          ? " ticket-details-workspace--upper-collapsed"
          : "")
      }
      style={{ "--ticket-workspace-columns": gridTemplateColumns }}
    >
      {orderedPanels.map((panel) => (
        <WorkspacePanel
          key={panel.id}
          panel={panel}
          onModeChange={onPanelModeChange}
        />
      ))}
    </div>
  );
}
