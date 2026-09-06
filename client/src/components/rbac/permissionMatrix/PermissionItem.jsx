import {
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";

function PermissionItem({
  permission,
  checked,
  disabled = false,
  onChange,
}) {
  return (
    <FormControlLabel
      labelPlacement="start"
      disabled={disabled}
      control={
        <Checkbox
          checked={checked}
          onChange={(event) => {
            onChange(permission, event.target.checked);
          }}
          size="small"
          inputProps={{
            "aria-label": permission.name,
          }}
        />
      }
      label={
        <Typography
          component="span"
          variant="body2"
          color="text.primary"
        >
          {permission.name}
        </Typography>
      }
      sx={{
        width: "100%",
        minHeight: 38,
        m: 0,
        px: 1,
        borderRadius: 1,
        justifyContent: "space-between",
        transition: "background-color 120ms ease",

        "&:hover": {
          bgcolor: "action.hover",
        },

        "& .MuiFormControlLabel-label": {
          flex: 1,
          minWidth: 0,
        },

        "& .MuiCheckbox-root": {
          flexShrink: 0,
        },
      }}
    />
  );
}

export default PermissionItem;