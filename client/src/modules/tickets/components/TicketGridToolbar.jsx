import { useCallback, useState } from "react";
import { ColumnsPanelTrigger, Toolbar } from "@mui/x-data-grid";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Button, Stack } from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import Tooltip from "@mui/material/Tooltip";
import { TICKET_MODULE_CONFIG } from "../../../config/ticket.config";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CanAccess from "../../../components/rbac/CanAccess";
import TicketExportDialog from "./TicketExportDialog";
import { TICKET_EXPORT_CONFIG } from "../config/ticketExport.config";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";

export default function TicketGridToolbar({
  search = "",
  onSearchChange,
  onOpenFilters,
  filters = {},
  activeFilterCount = 0,
  selectedTicketIds = [],
  rowCount = 0,
  onDuplicateTicket,
}) {
  const [exportOpen, setExportOpen] = useState(false);

  const handleOpenExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleCloseExport = useCallback(() => {
    setExportOpen(false);
  }, []);

  const canDuplicate =
    selectedTicketIds.length === 1 && typeof onDuplicateTicket === "function";

  const duplicateTooltip =
    selectedTicketIds.length === 0
      ? "Select one ticket to duplicate."
      : selectedTicketIds.length > 1
        ? "Select only one ticket to duplicate."
        : "Create a duplicate of the selected ticket.";

  return (
    <>
      <Toolbar
        sx={{
          minHeight: "auto",
          px: 1,
          py: 0.75,
          gap: 1,
          justifyContent: "space-between",
        }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search tickets..."
          aria-label="Search tickets"
          sx={{
            width: {
              xs: "100%",
              sm: 320,
            },
          }}
          slotProps={{
            input: {
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={() => onSearchChange?.("")}
                    aria-label="Clear ticket search"
                  >
                    <ClearOutlinedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />

        <Stack direction="row" spacing={1}>
          <CanAccess permission={TICKET_MODULE_CONFIG.permissions.create}>
            <Tooltip title={duplicateTooltip}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyOutlinedIcon />}
                  disabled={!canDuplicate}
                  onClick={() => {
                    if (canDuplicate) {
                      onDuplicateTicket(selectedTicketIds[0]);
                    }
                  }}
                  aria-label="Duplicate selected ticket"
                >
                  Duplicate
                </Button>
              </span>
            </Tooltip>
          </CanAccess>
          <Button
            size="small"
            variant={activeFilterCount > 0 ? "contained" : "outlined"}
            startIcon={<FilterAltOutlinedIcon />}
            onClick={onOpenFilters}
            aria-label="Filter tickets"
          >
            Filters
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
          <ColumnsPanelTrigger
            render={
              <Button
                size="small"
                variant="outlined"
                startIcon={<ViewColumnOutlinedIcon />}
                aria-label="Choose columns"
              />
            }
          />
          <CanAccess permission={TICKET_EXPORT_CONFIG.permission}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={handleOpenExport}
              aria-label="Export tickets"
            >
              Export
            </Button>
          </CanAccess>
        </Stack>
      </Toolbar>

      <TicketExportDialog
        open={exportOpen}
        onClose={handleCloseExport}
        selectedTicketIds={selectedTicketIds}
        search={search}
        filters={filters}
        rowCount={rowCount}
      />
    </>
  );
}
