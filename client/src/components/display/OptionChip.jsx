
import { Chip } from "@mui/material";
import { getOption } from "../../modules/tickets/utils/ticketFormatters";

export default function OptionChip({ value, options, fallback = "Not available" }) {
  const option = getOption(options, value);

  return (
    <Chip
      label={option?.label ?? value ?? fallback}
      color={option?.color ?? "default"}
      size="small"
      variant={option?.color ? "filled" : "outlined"}
    />
  );
}
