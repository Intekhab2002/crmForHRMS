import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";

import { OPTION_CONFIG } from "../options.config";

export default function OptionTypeSelector({
    value,
    onChange,
    disabled = false,
}) {
    return (
        <FormControl
            fullWidth
            size="small"
            disabled={disabled}
        >
            <InputLabel id="option-type-label">
                Option type
            </InputLabel>

            <Select
                labelId="option-type-label"
                id="option-type"
                value={value}
                label="Option type"
                onChange={(event) =>
                    onChange(event.target.value)
                }
            >
                {OPTION_CONFIG.map(
                    (option) => (
                        <MenuItem
                            key={option.key}
                            value={option.key}
                        >
                            {option.label}
                        </MenuItem>
                    ),
                )}
            </Select>
        </FormControl>
    );
}