import { FormControlLabel, Checkbox, Menu, MenuItem } from "@mui/material";

export default function DashboardCustomizeMenu({ anchorEl, open, onClose, widgets, onToggle }) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      {widgets.map((widget) => (
        <MenuItem key={widget.id}>
          <FormControlLabel
            control={
              <Checkbox
                checked={widget.visible !== false}
                onChange={() => onToggle(widget.id)}
              />
            }
            label={widget.id}
          />
        </MenuItem>
      ))}
    </Menu>
  );
}
