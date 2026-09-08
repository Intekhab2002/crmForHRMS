import { useCallback, useState } from "react";
import { Toolbar } from "@mui/x-data-grid";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Button, Stack } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import CanAccess from "../../../components/rbac/CanAccess";
import TicketExportDialog from "./TicketExportDialog";
import { TICKET_EXPORT_CONFIG } from "../config/ticketExport.config";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";

export default function TicketGridToolbar({
  search = "",
  onSearchChange,
  onOpenFilters,
  activeFilterCount = 0,
  selectedTicketIds = [],
}) {
  const [exportOpen, setExportOpen] = useState(false);

  const handleOpenExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleCloseExport = useCallback(() => {
    setExportOpen(false);
  }, []);

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
        activeFilters={{}}
      />
    </>
  );
}
