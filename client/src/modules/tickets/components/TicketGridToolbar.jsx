import { useCallback, useState } from "react";
import {
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  Toolbar,
} from "@mui/x-data-grid";
import { Button, Stack } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import CanAccess from "../../../components/rbac/CanAccess";
import TicketExportDialog from "./TicketExportDialog";
import { TICKET_EXPORT_CONFIG } from "../config/ticketExport.config";

export default function TicketGridToolbar() {
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
        <QuickFilter defaultExpanded>
          <QuickFilterControl
            aria-label="Search tickets"
            placeholder="Search..."
            debounceMs={300}
          />
          <QuickFilterClear aria-label="Clear ticket search" />
        </QuickFilter>

        <Stack direction="row" spacing={1}>
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

      <TicketExportDialog open={exportOpen} onClose={handleCloseExport} />
    </>
  );
}
