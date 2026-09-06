import { Box, Typography } from "@mui/material";

export default function DetailField({
  label,
  value,
  secondary = false,
  multiline = false,
  empty = false,
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="div"
        variant="caption"
        color="text.secondary"
        sx={{
          fontSize: "0.7rem",
          lineHeight: 1.25,
          fontWeight: 700,
          mb: 0.25,
        }}
      >
        {label}
      </Typography>

      <Typography
        component="div"
        variant="body2"
        color={secondary ? "text.secondary" : "text.primary"}
        fontWeight={empty ? 400 : 600}
        sx={{
          fontSize: "0.82rem",
          lineHeight: multiline ? 1.45 : 1.3,
          minWidth: 0,
          minHeight: "1.05rem",
          whiteSpace: multiline ? "pre-wrap" : "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
