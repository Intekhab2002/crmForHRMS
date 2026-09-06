import { Autocomplete, TextField } from "@mui/material";

export default function FormAutocomplete({
  field,
  formik,
  options = [],
  multiple = false,
}) {
  const rawValue =
    formik.values[field.name] ?? (multiple ? [] : "");

  const error =
    formik.touched[field.name] &&
    Boolean(formik.errors[field.name]);

  const selectedValue = multiple
    ? options.filter((option) =>
        rawValue.includes(option.value),
      )
    : options.find(
        (option) => option.value === rawValue,
      ) ?? null;

  return (
    <Autocomplete
      multiple={multiple}
      fullWidth
      options={options}
      value={selectedValue}
      onChange={(_event, value) => {
        formik.setFieldValue(
          field.name,
          multiple
            ? value.map((option) => option.value)
            : value?.value ?? "",
        );
      }}
      onBlur={() => {
        formik.setFieldTouched(field.name, true);
      }}
      isOptionEqualToValue={(option, value) =>
        option.value === value.value
      }
      getOptionLabel={(option) =>
        option?.label ?? ""
      }
      filterSelectedOptions={multiple}
      autoHighlight
      clearOnEscape
      noOptionsText="No matching options"
      renderInput={(params) => (
        <TextField
          {...params}
          id={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          placeholder={
            field.placeholder ??
            "Search or select..."
          }
          error={Boolean(error)}
          helperText={
            formik.touched[field.name]
              ? formik.errors[field.name]
              : field.helperText
          }
        />
      )}
    />
  );
}