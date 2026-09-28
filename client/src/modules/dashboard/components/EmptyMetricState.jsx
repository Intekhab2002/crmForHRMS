import { Stack, Typography } from "@mui/material";

export default function EmptyMetricState({ label = "No data available." }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 140 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}
