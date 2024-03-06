"use client";

import React from "react";
import { useFilterValueState } from "../filter";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs from "dayjs";

export interface FilterDateRangePickerProps {
  field: string;
  startOperator?: string;
  endOperator?: string;
}

export function FilterDateRangePicker({
  field,
  startOperator = "gte",
  endOperator = "lte",
}: FilterDateRangePickerProps) {
  const [startValue, setStartValue] = useFilterValueState(field, startOperator);
  const [endValue, setEndValue] = useFilterValueState(field, endOperator);

  const value: [dayjs.Dayjs, dayjs.Dayjs] = React.useMemo(
    () => [dayjs(startValue), dayjs(endValue)],
    [startValue, endValue],
  );
  const handleChange = React.useCallback(
    (newRange: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
      if (newRange[0] && newRange[1]) {
        setStartValue(newRange[0].format("YYYY-MM-DD"));
        setEndValue(newRange[1].format("YYYY-MM-DD"));
      }
    },
    [setEndValue, setStartValue],
  );
  return <DateRangePicker value={value} onChange={handleChange} />;
}
