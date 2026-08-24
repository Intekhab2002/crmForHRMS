import {
  Button,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function FieldOptionsEditor({ values, setFieldValue }) {
  const options = values.optionsConfig?.static ?? [];
  const dataSource = values.optionsConfig?.dataSource ?? {
    type: "api",
    endpoint: "",
  };

  const setOptions = (next) =>
    setFieldValue("optionsConfig", {
      ...(values.optionsConfig ?? {}),
      static: next,
    });

  const addOption = () =>
    setOptions([
      ...options,
      { label: "", value: "" },
    ]);

  const updateOption = (index, key, value) => {
    const next = options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, [key]: value } : option,
    );
    setOptions(next);
  };

  const removeOption = (index) =>
    setOptions(options.filter((_, optionIndex) => optionIndex !== index));

  function setDataSource(next) {
    setFieldValue("optionsConfig", {
      ...(values.optionsConfig ?? {}),
      dataSource: next,
    });
  }

  const supportsOptions = ["select", "multi_select", "autocomplete", "radio"].includes(
    values.type,
  );

  if (!supportsOptions) {
    return (
      <Typography color="text.secondary">
        Options are available for select, multi-select, autocomplete and radio fields.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>
          Static options
        </Typography>
        <Button size="small" variant="outlined" onClick={addOption}>
          Add option
        </Button>
      </Stack>

      {options.map((option, index) => (
        <Grid container spacing={1} key={`${index}-${option.value}`}>
          <Grid size={{ xs: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Label"
              value={option.label}
              onChange={(event) =>
                updateOption(index, "label", event.target.value)
              }
            />
          </Grid>
          <Grid size={{ xs: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Value"
              value={option.value}
              onChange={(event) =>
                updateOption(index, "value", event.target.value)
              }
            />
          </Grid>
          <Grid size={{ xs: 2 }} display="flex" alignItems="center">
            <IconButton color="error" onClick={() => removeOption(index)}>
              <DeleteOutlineIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Divider />

      <Typography variant="subtitle1" fontWeight={700}>
        Controlled data source
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label="Source Type"
            value={dataSource.type ?? "api"}
            onChange={(event) =>
              setDataSource({
                ...dataSource,
                type: event.target.value,
              })
            }
          >
            <MenuItem value="api">API</MenuItem>
            <MenuItem value="static">Static</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="Endpoint"
            value={dataSource.endpoint ?? ""}
            onChange={(event) =>
              setDataSource({
                ...dataSource,
                endpoint: event.target.value,
              })
            }
            helperText="Declarative endpoint metadata only."
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
