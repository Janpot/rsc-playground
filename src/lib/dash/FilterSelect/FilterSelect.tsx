"use client";

import React from "react";
import { MenuItem, Select } from "@mui/material";
import { useFilterValueState } from "../filter";

export interface FilterSelectProps {
  options: string[];
  field: string;
  operator?: string;
}

export function FilterSelect({ options, field, operator }: FilterSelectProps) {
  const [value, setValue] = useFilterValueState(field, operator);

  return (
    <Select value={value ?? ""} onChange={(e) => setValue(e.target.value)}>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  );
}
