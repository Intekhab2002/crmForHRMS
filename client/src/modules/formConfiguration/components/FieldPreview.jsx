import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

function PreviewControl({ values }) {
  const label = values.label || "Preview field";
  const options = values.optionsConfig?.static ?? [];

  if (values.type === "textarea") {
    return <TextField fullWidth multiline minRows={3} label={label} placeholder={values.placeholder} />;
  }

  if (values.type === "select" || values.type === "autocomplete") {
    return (
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select label={label} defaultValue="">
          <MenuItem value="">Select...</MenuItem>
          {options.map((option, index) => (
            <MenuItem key={`${index}-${option.value}`} value={option.value}>
              {option.label || option.value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (values.type === "multi_select") {
    return (
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select multiple label={label} value={[]} onChange={() => {}}>
          {options.map((option, index) => (
            <MenuItem key={`${index}-${option.value}`} value={option.value}>
              {option.label || option.value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (values.type === "checkbox") {
    return <FormControlLabel control={<Checkbox />} label={label} />;
  }

  if (values.type === "switch") {
    return <FormControlLabel control={<Switch />} label={label} />;
  }

  if (values.type === "radio") {
    return (
      <FormControl>
        <Typography variant="body2" mb={0.5}>{label}</Typography>
        <RadioGroup row>
          {options.map((option, index) => (
            <FormControlLabel
              key={`${index}-${option.value}`}
              value={option.value}
              control={<Radio />}
              label={option.label || option.value}
            />
          ))}
        </RadioGroup>
      </FormControl>
    );
  }

  return (
    <TextField
      fullWidth
      type={
        ["number", "email", "date", "datetime-local", "time"].includes(values.type)
          ? values.type === "datetime" ? "datetime-local" : values.type
          : "text"
      }
      label={label}
      placeholder={values.placeholder}
    />
  );
}

export default function FieldPreview({ values }) {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="overline" color="text.secondary">
          Live Preview
        </Typography>

        <PreviewControl values={values} />

        {values.helpText ? (
          <Typography variant="caption" color="text.secondary">
            {values.helpText}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
