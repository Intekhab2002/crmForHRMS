import { Alert, Box } from "@mui/material";
import { getFieldRenderer } from "./registry/rendererRegistry";

export default function DynamicFieldRenderer({ field, formik }) {
  if (!field?.visible) return null;

  const Renderer = getFieldRenderer(field.type);

  if (!Renderer) {
    return <Alert severity="warning">Unsupported field type: {field.type}</Alert>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Renderer field={field} formik={formik} />
    </Box>
  );
}