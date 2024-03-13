"use client";

import React from "react";
import {
  Parameter,
  useParameterValues,
  useSetParameterValues,
} from "../filter";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs from "dayjs";

export interface ParameterDateRangePickerProps {
  start: Parameter<string>;
  end: Parameter<string>;
}

export function ParameterDateRangePicker({
  start,
  end,
}: ParameterDateRangePickerProps) {
  const stableParams = React.useMemo(() => [start, end], [start, end]);
  const values = useParameterValues(stableParams);
  const setValues = useSetParameterValues(stableParams);

  const value: [dayjs.Dayjs, dayjs.Dayjs] = React.useMemo(
    () => [dayjs(values[start.name]), dayjs(values[end.name])],
    [end.name, start.name, values],
  );
  const handleChange = React.useCallback(
    (newRange: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
      if (newRange[0] && newRange[1]) {
        setValues({
          [start.name]: newRange[0].format("YYYY-MM-DD"),
          [end.name]: newRange[1].format("YYYY-MM-DD"),
        });
      }
    },
    [setValues, end.name, start.name],
  );
  return <DateRangePicker value={value} onChange={handleChange} />;
}
