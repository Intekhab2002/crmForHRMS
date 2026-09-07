import { Box } from "@mui/material";

export default function ModulePage({
  children,
  scroll = true,
  sx,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        

        ...(scroll
          ? {
              minHeight: "100%",
            }
          : {
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }),

        ...sx,
      }}
    >
      {children}
    </Box>
  );
}