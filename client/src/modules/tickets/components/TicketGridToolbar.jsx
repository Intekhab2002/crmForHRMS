
import { useCallback, useState } from "react";
import {
  ColumnsPanelTrigger,
  Toolbar,
} from "@mui/x-data-grid";
import {
  Badge,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";

import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { TICKET_MODULE_CONFIG } from "../../../config/ticket.config";
import CanAccess from "../../../components/rbac/CanAccess";
import TicketExportDialog from "./TicketExportDialog";
import { TICKET_EXPORT_CONFIG } from "../config/ticketExport.config";

export default function TicketGridToolbar({
  search = "",
  onSearchChange,
  onOpenFilters,
  filters = {},
  activeFilterCount = 0,
  selectedTicketIds = [],
  rowCount = 0,
  onDuplicateTicket,
  onBulkEdit,
}) {
  const [exportOpen, setExportOpen] = useState(false);

  const handleOpenExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleCloseExport = useCallback(() => {
    setExportOpen(false);
  }, []);

  const canDuplicate =
    selectedTicketIds.length === 1 &&
    typeof onDuplicateTicket === "function";

  const duplicateTooltip =
    selectedTicketIds.length === 0
      ? "Select one ticket to duplicate"
      : selectedTicketIds.length > 1
        ? "Select only one ticket to duplicate"
        : "Duplicate selected ticket";

  return (
    <>
      <Toolbar
        sx={{
          minHeight: "auto",
          px: { xs: 1, sm: 1.5 },
          py: 1,
          gap: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          "& .MuiIconButton-root": {
            width: 36,
            height: 36,
            flexShrink: 0,
          },
        }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(event) =>
            onSearchChange?.(event.target.value)
          }
          placeholder="Search tickets..."
          aria-label="Search tickets"
          fullWidth={false}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon
                    fontSize="small"
                    color="action"
                  />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <Tooltip title="Clear search">
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => onSearchChange?.("")}
                      aria-label="Clear ticket search"
                    >
                      <ClearOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 220px" },
            width: { xs: "100%", sm: 280 },
            minWidth: 0,
            maxWidth: { sm: 360 },
            "& .MuiInputBase-root": {
              minWidth: 0,
            },
          }}
        />

        <Stack
          direction="row"
          spacing={{ xs: 0.5, sm: 1 }}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
          sx={{
            width: { xs: "100%", sm: "auto" },
            minWidth: 0,
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
          }}
        >
          <CanAccess
            permission={TICKET_MODULE_CONFIG.permissions.update}
          >
            <Tooltip title="Multi-edit selected tickets">
              <span>
                <IconButton
                  size="small"
                  disabled={
                    selectedTicketIds.length === 0 ||
                    typeof onBulkEdit !== "function"
                  }
                  onClick={onBulkEdit}
                  aria-label="Multi-edit selected tickets"
                >
                  <EditOutlinedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </CanAccess>

          <CanAccess
            permission={TICKET_MODULE_CONFIG.permissions.create}
          >
            <Tooltip title={duplicateTooltip}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canDuplicate}
                  onClick={() => {
                    if (canDuplicate) {
                      onDuplicateTicket(selectedTicketIds[0]);
                    }
                  }}
                  aria-label="Duplicate selected ticket"
                >
                  <ContentCopyOutlinedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </CanAccess>

          <Tooltip
            title={
              activeFilterCount > 0
                ? `Filters (${activeFilterCount} active)`
                : "Filter tickets"
            }
          >
            <IconButton
              size="small"
              onClick={onOpenFilters}
              aria-label={`Filter tickets${
                activeFilterCount > 0
                  ? `, ${activeFilterCount} active`
                  : ""
              }`}
              aria-haspopup="dialog"
            >
              <Badge
                badgeContent={activeFilterCount}
                color="primary"
                max={99}
                invisible={activeFilterCount <= 0}
              >
                <FilterAltOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Choose columns">
            <ColumnsPanelTrigger
              render={
                <IconButton
                  size="small"
                  aria-label="Choose ticket columns"
                >
                  <ViewColumnOutlinedIcon />
                </IconButton>
              }
            />
          </Tooltip>

          <CanAccess permission={TICKET_EXPORT_CONFIG.permission}>
            <Tooltip title="Export tickets">
              <IconButton
                size="small"
                onClick={handleOpenExport}
                aria-label="Export tickets"
              >
                <DownloadOutlinedIcon />
              </IconButton>
            </Tooltip>
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
