import {
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
} from "@mui/material";

export default function FieldDisplayPanel({ values, setFieldValue }) {
  const toggle = (name) => (event) =>
    setFieldValue(name, event.target.checked);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Placeholder"
          name="placeholder"
          value={values.placeholder ?? ""}
          onChange={(event) => setFieldValue("placeholder", event.target.value)}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Help Text"
          name="helpText"
          value={values.helpText ?? ""}
          onChange={(event) => setFieldValue("helpText", event.target.value)}
        />
      </Grid>

      <Grid size={12}>
        <FormControlLabel
          control={<Checkbox checked={values.isVisible} onChange={toggle("isVisible")} />}
          label="Visible"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isEnabled} onChange={toggle("isEnabled")} />}
          label="Enabled"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isEditable} onChange={toggle("isEditable")} />}
          label="Editable"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isReadOnly} onChange={toggle("isReadOnly")} />}
          label="Read only"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isRequired} onChange={toggle("isRequired")} />}
          label="Required"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isSearchable} onChange={toggle("isSearchable")} />}
          label="Searchable"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isFilterable} onChange={toggle("isFilterable")} />}
          label="Filterable"
        />
        <FormControlLabel
          control={<Checkbox checked={values.isSortable} onChange={toggle("isSortable")} />}
          label="Sortable"
        />
      </Grid>
    </Grid>
  );
}
