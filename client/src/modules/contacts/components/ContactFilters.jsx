import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

const EMPTY_FILTERS = Object.freeze({
  organizationId: "",
  departmentId: "",
  districtId: "",
  isActive: "true",
});

function optionId(option) {
  return option?.id ?? option?.value ?? "";
}

function optionLabel(option) {
  return option?.name ?? option?.label ?? option?.title ?? "";
}

export default function ContactFilters({
  open,
  filters,
  organizations = [],
  departments = [],
  districts = [],
  onApply,
  onClose,
}) {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });

  useEffect(() => {
    if (!open) return;

    setDraft({
      ...EMPTY_FILTERS,
      ...filters,
      isActive:
        typeof filters?.isActive === "boolean"
          ? String(filters.isActive)
          : filters?.isActive ?? "true",
    });
  }, [filters, open]);

  const update = (key) => (event) => {
    setDraft((current) => ({ ...current, [key]: event.target.value }));
  };

  const clear = () => setDraft({ ...EMPTY_FILTERS });

  const apply = () => {
    const next = {};
    for (const key of ["organizationId", "departmentId", "districtId"]) {
      if (draft[key]) next[key] = draft[key];
    }
    if (draft.isActive !== "") {
      next.isActive = draft.isActive === "true";
    }
    onApply(next);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="contact-filter-title"
    >
      <DialogTitle
        id="contact-filter-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <FilterAltOutlinedIcon fontSize="small" />
        Filter Contacts
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Organization"
              value={draft.organizationId ?? ""}
              onChange={update("organizationId")}
            >
              <MenuItem value="">All organizations</MenuItem>
              {organizations.map((item) => (
                <MenuItem key={optionId(item)} value={optionId(item)}>
                  {optionLabel(item)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Department"
              value={draft.departmentId ?? ""}
              onChange={update("departmentId")}
            >
              <MenuItem value="">All departments</MenuItem>
              {departments.map((item) => (
                <MenuItem key={optionId(item)} value={optionId(item)}>
                  {optionLabel(item)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="District"
              value={draft.districtId ?? ""}
              onChange={update("districtId")}
            >
              <MenuItem value="">All districts</MenuItem>
              {districts.map((item) => (
                <MenuItem key={optionId(item)} value={optionId(item)}>
                  {optionLabel(item)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Contact status"
              value={draft.isActive ?? "true"}
              onChange={update("isActive")}
            >
              <MenuItem value="true">Active contacts</MenuItem>
              <MenuItem value="false">Inactive contacts</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          width="100%"
        >
          <Button
            onClick={clear}
            startIcon={<RestartAltOutlinedIcon />}
          >
            Reset
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={apply}>
              Apply filters
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
