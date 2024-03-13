"use client";

import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Parameter, useParameterValue, useSetParameterValue } from "../filter";

export interface ParameterSelectProps<V extends string> {
  options: readonly V[];
  parameter: Parameter<V>;
}

export function ParameterSelect<V extends string>({
  options,
  parameter,
}: ParameterSelectProps<V>) {
  const value = useParameterValue(parameter);
  const setValue = useSetParameterValue(parameter);

  const id = React.useId();
  const labelId = `${id}-label`;
  const label = parameter.name;

  return (
    <FormControl>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value as V)}
        label={label}
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
