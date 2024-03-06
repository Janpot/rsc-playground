"use client";

import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { PieChart as XPieChart } from "@mui/x-charts";
import { Box, MenuItem, Select } from "@mui/material";
import {
  FilterFieldDef,
  FilterProvider,
  useFilter,
  useFilterValueState,
} from "./filter";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs from "dayjs";
import { getObjectKey } from "./utils";
import { ResolvedDataProvider } from "./data";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export interface DashboardProps {
  children?: React.ReactNode;
  filter?: FilterFieldDef[];
}

export function Dashboard({ children, filter = [] }: DashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider fields={filter}>{children}</FilterProvider>
    </QueryClientProvider>
  );
}

export * from "./data";
export * from "./DataGrid";
export * from "./LineChart";

export interface PieChartProps {
  dataProvider: ResolvedDataProvider;
  dimension: string;
  label: string;
}

export function PieChart({ dataProvider, dimension, label }: PieChartProps) {
  const filter = useFilter();

  const key = getObjectKey(dataProvider);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["data", key],
    queryFn: () => dataProvider.getMany({ filter: [] }),
  });

  const series = React.useMemo(() => {
    const rows = data?.rows ?? [];

    const seriesData = rows.map((row) => ({
      id: row._index,
      value: row[dimension],
      label: row[label],
    }));
    return [{ data: seriesData }];
  }, [data, dimension, label]);

  return (
    <Box sx={{ height: 400 }}>
      <XPieChart series={series} />
    </Box>
  );
}

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
