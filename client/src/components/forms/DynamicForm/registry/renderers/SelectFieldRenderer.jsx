import {
  CircularProgress,
  MenuItem,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  getCommonFieldProps,
  normalizeOption,
} from "./rendererUtils";

import {
  loadRuntimeOptions,
} from "../runtimeOptionProvider";

export default function SelectFieldRenderer({
  field,
  formik,
}) {
  const [options, setOptions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadError, setLoadError] =
    useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const result =
          await loadRuntimeOptions(field);

        if (!cancelled) {
          setOptions(result);
        }
      } catch (error) {
        if (!cancelled) {
          setOptions([]);
          setLoadError(
            error?.message ??
              "Unable to load options.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [field]);

  const commonProps =
    getCommonFieldProps(
      field,
      formik,
    );

  return (
    <TextField
      {...commonProps}
      fullWidth
      select
      slotProps={{
        input: {
          readOnly: Boolean(
            field.readOnly,
          ),
        },
      }}
      helperText={
        loadError ??
        commonProps.helperText
      }
    >
      {loading ? (
        <MenuItem disabled>
          <CircularProgress
            size={18}
            sx={{ mr: 1 }}
          />
          Loading...
        </MenuItem>
      ) : (
        options.map(
          (item, index) => {
            const option =
              normalizeOption(item);

            return (
              <MenuItem
                key={`${String(
                  option.value,
                )}-${index}`}
                value={
                  option.value
                }
              >
                {option.label}
              </MenuItem>
            );
          },
        )
      )}
    </TextField>
  );
}