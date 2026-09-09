import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
} from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import { TICKET_LIST_FILTER_CONFIG } from "../../../config/ticketListFilter.config";
import { apiOptionProvider } from "../../../components/forms/optionProviders/apiOption.provider";

function createInitialValues(filters) {
  return { ...filters };
}

function getLookupValues(options, values) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const selectedValues = new Set(values);

  return options.filter((option) => selectedValues.has(option.value));
}

export default function TicketListFilters({
  open,
  filters = {},
  onApply,
  onClose,
}) {
  const [draftFilters, setDraftFilters] = useState(() =>
    createInitialValues(filters),
  );

  const [options, setOptions] = useState({});
  const [loadingKeys, setLoadingKeys] = useState({});
  const [loadError, setLoadError] = useState("");

  const loadedKeysRef = useRef(new Set());
  const loadingKeysRef = useRef(new Set());

  useEffect(() => {
    if (!open) return;

    setDraftFilters(createInitialValues(filters));
    setLoadError("");
  }, [filters, open]);

  const lookupFilters = useMemo(
    () =>
      TICKET_LIST_FILTER_CONFIG.filter((filter) => filter.type === "lookup"),
    [],
  );

  const loadOptions = useCallback(async (filter) => {
    if (
      loadedKeysRef.current.has(filter.key) ||
      loadingKeysRef.current.has(filter.key)
    ) {
      return;
    }

    loadingKeysRef.current.add(filter.key);

    setLoadingKeys((current) => ({
      ...current,
      [filter.key]: true,
    }));

    try {
      const nextOptions = await apiOptionProvider({
        config: filter,
      });

      loadedKeysRef.current.add(filter.key);

      setOptions((current) => ({
        ...current,
        [filter.key]: nextOptions,
      }));
    } catch (error) {
      setLoadError(
        error?.response?.data?.message ??
          error?.message ??
          `Unable to load ${filter.label}.`,
      );
    } finally {
      loadingKeysRef.current.delete(filter.key);

      setLoadingKeys((current) => ({
        ...current,
        [filter.key]: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    lookupFilters
      .filter((filter) => Boolean(filters[filter.queryKey]))
      .forEach((filter) => {
        void loadOptions(filter);
      });
  }, [filters, loadOptions, lookupFilters, open]);

  const handleChange = (queryKey, value) => {
    setDraftFilters((current) => {
      const next = { ...current };

      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete next[queryKey];
      } else {
        next[queryKey] = value;
      }

      return next;
    });
  };

  const handleDateChange = (queryKey, value) => {
    handleChange(queryKey, value);
  };

  const handleClear = () => {
    setDraftFilters({});
  };

  const handleApply = () => {
    onApply(draftFilters);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="ticket-list-filter-dialog-title"
    >
      <DialogTitle
        id="ticket-list-filter-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <FilterAltOutlinedIcon fontSize="small" />
        Filter Tickets
      </DialogTitle>

      <DialogContent dividers>
        {loadError ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setLoadError("")}
          >
            {loadError}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          {lookupFilters.map((filter) => {
            const filterOptions = options[filter.key] ?? [];
            const selectedValue = getLookupValues(
              filterOptions,
              draftFilters[filter.queryKey],
            );

            return (
              <Grid key={filter.key} size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  multiple={filter.multi === true}
                  fullWidth
                  options={filterOptions}
                  value={selectedValue}
                  loading={Boolean(loadingKeys[filter.key])}
                  onOpen={() => loadOptions(filter)}
                  onChange={(_event, values) => {
                    handleChange(
                      filter.queryKey,
                      values.map((option) => option.value),
                    );
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  getOptionLabel={(option) => option?.label ?? ""}
                  clearOnEscape
                  autoHighlight
                  disableCloseOnSelect
                  noOptionsText={
                    loadingKeys[filter.key]
                      ? "Loading..."
                      : "No matching options"
                  }
                  renderTags={(tagValue, getTagProps) => {
                    if (tagValue.length === 0) {
                      return null;
                    }

                    const visibleTags = tagValue.slice(0, 1);
                    const hiddenCount = tagValue.length - visibleTags.length;

                    return (
                      <>
                        {visibleTags.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });

                          return (
                            <Chip
                              key={key}
                              {...tagProps}
                              label={option.label}
                              size="small"
                              sx={{
                                maxWidth: "calc(100% - 8px)",
                                height: 24,
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                },
                              }}
                            />
                          );
                        })}

                        {hiddenCount > 0 && (
                          <Chip
                            label={`+${hiddenCount}`}
                            size="small"
                            sx={{
                              height: 24,
                              flexShrink: 0,
                              "& .MuiChip-label": {
                                px: 0.75,
                              },
                            }}
                          />
                        )}
                      </>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={filter.label}
                      placeholder={`Select ${filter.label.toLowerCase()}`}
                    />
                  )}
                  sx={{
                    "& .MuiAutocomplete-inputRoot": {
                      minHeight: 40,
                      maxHeight: 40,
                      overflow: "hidden",
                      flexWrap: "nowrap",
                      alignItems: "center",
                      py: 0.25,
                    },

                    "& .MuiAutocomplete-input": {
                      minWidth: "40px !important",
                      py: "4px !important",
                    },

                    "& .MuiAutocomplete-tag": {
                      flexShrink: 0,
                    },

                    "& .MuiAutocomplete-endAdornment": {
                      right: 6,
                    },

                    "& .MuiInputLabel-root": {
                      maxWidth: "calc(100% - 60px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </Grid>
            );
          })}

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {TICKET_LIST_FILTER_CONFIG.filter(
            (filter) => filter.type === "text",
          ).map((filter) => (
            <Grid key={filter.key} size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={filter.label}
                value={draftFilters[filter.queryKey] ?? ""}
                onChange={(event) =>
                  handleChange(filter.queryKey, event.target.value)
                }
              />
            </Grid>
          ))}

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {TICKET_LIST_FILTER_CONFIG.filter(
            (filter) => filter.type === "dateRange",
          ).map((filter) => (
            <Grid key={filter.key} size={{ xs: 12 }}>
              <Box>
                <Box
                  sx={{
                    mb: 1,
                    typography: "body2",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  {filter.label}
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="From"
                      value={draftFilters[filter.fromQueryKey] ?? ""}
                      onChange={(event) =>
                        handleDateChange(
                          filter.fromQueryKey,
                          event.target.value,
                        )
                      }
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="To"
                      value={draftFilters[filter.toQueryKey] ?? ""}
                      onChange={(event) =>
                        handleDateChange(filter.toQueryKey, event.target.value)
                      }
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClear} color="inherit">
          Clear All
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={handleApply}
          startIcon={<FilterAltOutlinedIcon />}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}
