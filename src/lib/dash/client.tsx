"use client";

import {
  DataGridPro,
  DataGridProProps,
  GridColDef,
  GridValueGetterParams,
} from "@mui/x-data-grid-pro";
import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { PieChart as XPieChart } from "@mui/x-charts";
import { Box, MenuItem, Select, Typography } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { DashboardFilter, FilterOption, useFilterValueState } from "./filter";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs from "dayjs";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export interface DashboardProps {
  children?: React.ReactNode;
}

export function Dashboard({ children }: DashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export interface ColDefExtraFields {
  valuePath?: string[];
}

export interface SerializableGridColDef
  extends Pick<GridColDef, "field" | "type" | "headerName">,
    ColDefExtraFields {}

export type DataProviderGridColDef = GridColDef & ColDefExtraFields;

export interface FetchDataParams {
  filter: FilterOption[];
}

export interface FetchData {
  (
    params: FetchDataParams,
  ): Promise<{ rows: any[]; columns?: SerializableGridColDef[] }>;
}

export interface DataGridProps
  extends Pick<DataGridProProps, "pagination" | "autoPageSize"> {
  dataProvider: FetchData;
  columns?: DataProviderGridColDef[];
  filter?: DashboardFilter;
}

function getRowId(row: any) {
  return Object.prototype.hasOwnProperty.call(row, "id") ? row.id : row._index;
}

const keys = new WeakMap();
let nextKey = 1;

function getKey(obj: Function) {
  let key = keys.get(obj);
  if (!key) {
    key = nextKey++;
    keys.set(obj, key);
  }
  return key;
}

function resolvePath(obj: any, path: string[]) {
  return path.reduce((acc, key) => {
    return typeof acc === "object" && Object.hasOwnProperty.call(acc, key)
      ? acc[key]
      : undefined;
  }, obj);
}

function dateValueGetter({ value }: GridValueGetterParams): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Date(value);
}

function wrapWithDateValueGetter(valueGetter?: GridColDef["valueGetter"]) {
  if (!valueGetter) {
    return dateValueGetter;
  }

  return (params: GridValueGetterParams) => {
    const value = valueGetter(params);
    return dateValueGetter({ ...params, value });
  };
}

export function DataGrid({
  dataProvider: fetchData,
  columns: columnsProp,
  filter,
  ...props
}: DataGridProps) {
  const key = getKey(fetchData);

  const { data, isLoading, error } = useQuery({
    queryKey: ["data", key, filter?.getKey()],
    queryFn: () => fetchData({ filter: filter?.filter ?? [] }),
  });

  const columns = React.useMemo(() => {
    const resolvedColumns: DataProviderGridColDef[] =
      columnsProp ?? data?.columns ?? [];

    return resolvedColumns.map((column) => {
      const valueGetters = [];

      let valueGetter = column.valueGetter;

      if (!valueGetter && column.valuePath) {
        const { valuePath } = column;
        valueGetter = (params: GridValueGetterParams) => {
          return resolvePath(params.row, valuePath);
        };
      }

      if (column.type === "date" || column.type === "dateTime") {
        valueGetter = wrapWithDateValueGetter(valueGetter);
      }

      return {
        ...column,
        valueGetter,
      };
    });
  }, [data, columnsProp]);

  const rows = React.useMemo(() => {
    return data?.rows.map((row, index) => ({ ...row, _index: index })) ?? [];
  }, [data]);

  return (
    <Box sx={{ height: 400, position: "relative" }}>
      <DataGridPro
        getRowId={getRowId}
        rows={rows}
        columns={columns}
        loading={isLoading}
        {...props}
      />
      {error && (
        <Box
          sx={{
            position: "absolute",
            inset: "0 0 0 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "background.paper",
            borderColor: "divider",
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1,
              alignItems: "center",
            }}
          >
            <ErrorIcon color="error" /> Error
          </Typography>
          <Typography textAlign="center">
            {error?.message ?? "Unknown error"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export interface PieChartProps {
  dataProvider: FetchData;
  dimension: string;
  label: string;
}

export function PieChart({
  dataProvider: fetchData,
  dimension,
  label,
}: PieChartProps) {
  const key = getKey(fetchData);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["data", key],
    queryFn: () => fetchData({ filter: [] }),
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
  filter: DashboardFilter;
  options: string[];
  field: string;
  operator?: string;
}

export function FilterSelect({
  filter,
  options,
  field,
  operator,
}: FilterSelectProps) {
  const [value, setValue] = useFilterValueState(filter, field, operator);

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
  filter: DashboardFilter;
  field: string;
  startOperator?: string;
  endOperator?: string;
}

export function FilterDateRangePicker({
  filter,
  field,
  startOperator = "gte",
  endOperator = "lte",
}: FilterDateRangePickerProps) {
  const [startValue, setStartValue] = useFilterValueState(
    filter,
    field,
    startOperator,
  );
  const [endValue, setEndValue] = useFilterValueState(
    filter,
    field,
    endOperator,
  );

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
