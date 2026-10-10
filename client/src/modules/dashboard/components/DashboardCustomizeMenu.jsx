import {
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

export default function DashboardCustomizeMenu({
  anchorEl,
  open,
  onClose,
  widgets = [],
  onToggle,
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { minWidth: 260, maxHeight: 420 },
        },
      }}
    >
      <MenuItem disabled>
        <Typography variant="subtitle2">Visible widgets</Typography>
      </MenuItem>
      {widgets.map((widget) => (
        <MenuItem key={widget.id} disableRipple>
          <FormControlLabel
            sx={{ width: "100%", m: 0 }}
            control={
              <Checkbox
                checked={widget.visible !== false}
                onChange={() => onToggle?.(widget.id)}
                size="small"
              />
            }
            label={widget.label ?? widget.name ?? widget.id}
          />
        </MenuItem>
      ))}
    </Menu>
  );
}
