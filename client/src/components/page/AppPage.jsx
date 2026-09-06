import { Stack } from "@mui/material";

export default function AppPage({
  children,
  spacing = 3,
  mode = "scroll",
  sx,
}) {
  const workspace = mode === "workspace";

  return (
    <Stack
      spacing={spacing}
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        p:2,

        ...(workspace
          ? {
              height: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }
          : {
              minHeight: "100%",
              overflowY: "auto",
              overflowX: "hidden",
            }),

        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}