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
          xs: 2,
          sm: 3,
        },
        py: {
          xs: 2,
          sm: 3,
        },
      }}
    >
      {children}
    </Box>
  );
}