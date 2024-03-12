"use client";

import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useFilterValueState } from "../filter";

export interface FilterSelectProps {
  options: string[];
  field: string;
  operator?: string;
}

export function FilterSelect({ options, field, operator }: FilterSelectProps) {
  const [value, setValue] = useFilterValueState(field, operator);
  const id = React.useId();
  const labelId = `${id}-label`;
  return (
    <FormControl>
      <InputLabel id={labelId}>{field}</InputLabel>
      <Select
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        label={field}
        labelId={labelId}
        id={id}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
