import { Stack } from "@mui/material";

export default function AppPage({
  children,
  spacing = 3,
  fill = false,
  sx,
}) {
  return (
    <Stack
      spacing={spacing}
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        ...(fill
          ? {
              flex: "1 1 0",
              display: "flex",
              flexDirection: "column",
            }
          : {}),
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}