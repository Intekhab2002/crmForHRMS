import { Stack, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { useSlaCountdown } from "../hooks/useSlaCountdown";
import { formatRemaining } from "../utils/slaFormatters";

export default function SlaCountdown({ sla }) {
  const countdown = useSlaCountdown(sla);
  if (!countdown) return null;

  return (
    <Stack direction="row" spacing={1} alignItems="center" aria-live="polite">
      <AccessTimeOutlinedIcon fontSize="small" aria-hidden="true" />
      <Typography component="span" variant="h6" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
        {formatRemaining(countdown.minutes)}
      </Typography>
      <Typography component="span" variant="body2" color="text.secondary">
        business time remaining
      </Typography>
    </Stack>
  );
}
