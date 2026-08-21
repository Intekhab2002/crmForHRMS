import {
  Alert,
  Box,
} from "@mui/material";

// import {
//   FIELD_RENDERERS,
// } from "./registry/fieldRegistry";

import {FIELD_RENDERERS} from "../DynamicForm/registry/fieldRegistry"

export default function DynamicFieldRenderer({
  field,
  formik,
}) {
  if (!field?.visible) {
    return null;
  }

  const renderer =
    FIELD_RENDERERS[field.type];

  if (!renderer) {
    return (
      <Alert severity="warning">
        Unsupported field type:
        {" "}
        {field.type}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      {renderer({
        field,
        formik,
      })}
    </Box>
  );
}