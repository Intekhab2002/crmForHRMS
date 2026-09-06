import { Box } from "@mui/material";

export default function PageViewport({ children }) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 0,
        position: "relative",
      }}
    >
      {children}
    </Box>
  );
}