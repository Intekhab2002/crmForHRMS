import { Box } from "@mui/material";

export default function PageViewport({
  children,
}) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 0,

        overflowY: "auto",
        overflowX: "hidden",

        display: "flex",
        flexDirection: "column",

        px: {
          xs: 1,
          sm: 2,
        },
        py: {
          xs: 1,
          sm: 2,
        },
      }}
    >
      {children}
    </Box>
  );
}