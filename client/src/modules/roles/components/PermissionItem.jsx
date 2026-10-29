
import { Checkbox, FormControlLabel } from "@mui/material";

export default function PermissionItem({
  permission,
  disabled = false,
  onChange,
}) {
  const inputId = `permission-${String(permission.id)}`;

  return (
    <FormControlLabel
      htmlFor={inputId}
      sx={{
        m: 0,
        px: 1,
        py: 0.25,
        minHeight: 44,
        width: "100%",
        borderRadius: 1.5,
        alignItems: "center",
        transition: "background-color 120ms ease",
        "&:hover": {
          bgcolor: disabled ? "transparent" : "action.hover",
        },
        "&:focus-within": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
        },
        "& .MuiFormControlLabel-label": {
          minWidth: 0,
          overflowWrap: "anywhere",
          flex: 1,
        },
      }}
      control={
        <Checkbox
          id={inputId}
          checked={permission.assigned}
          disabled={disabled}
          onChange={(event) =>
            onChange(permission.id, event.target.checked)
          }
          slotProps={{
            input: {
              "aria-label": permission.name,
            },
          }}
        />
      }
      label={permission.name}
    />
  );
}
