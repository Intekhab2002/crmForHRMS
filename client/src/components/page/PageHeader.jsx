
import { Stack, Typography } from "@mui/material";

export default function PageHeader({ title, description, actions = null }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={800}>
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>
      {actions}
    </Stack>
  );
}
