"use client";

import {
  DataGridPro,
  DataGridProProps,
  GridColDef,
  GridValidRowModel,
  GridValueGetterParams,
} from "@mui/x-data-grid-pro";
import React from "react";
import { Box } from "@mui/material";
import {
  ResolvedDataProvider,
  ResolvedField,
  Datum,
  useDataProviderGetMany,
} from "../data";
import { CardSurface, ErrorOverlay } from "../components";

export interface DataGridProps<R extends GridValidRowModel>
  extends Pick<DataGridProProps<R>, "pagination" | "autoPageSize"> {
  columns?: readonly GridColDef<R>[];
  dataProvider: ResolvedDataProvider<R>;
}

function getRowId(row: any) {
  console.log("row", row);
  return Object.prototype.hasOwnProperty.call(row, "id") ? row.id : row._index;
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

function getColumnsFromFields<R extends Datum>(
  fields: ResolvedField<R>[],
): readonly GridColDef<R>[] {
  return fields.map((field) => {
    const colDef: GridColDef<R> = {
      field: field.field,
      type: field.type,
      headerName: field.label,
    };
    const valueFormatter = field.valueFormatter;
    if (valueFormatter) {
      colDef.valueFormatter = valueFormatter;
    }
    return colDef;
  });
}

export function DataGrid<R extends GridValidRowModel>({
  dataProvider,
  columns: columnsProp,
  ...props
}: DataGridProps<R>) {
  const { data, isLoading, error } = useDataProviderGetMany(dataProvider);

  const columns = React.useMemo(() => {
    const resolvedColumns: readonly GridColDef[] =
      columnsProp ?? getColumnsFromFields(dataProvider.fields);

    return resolvedColumns.map((column) => {
      let valueGetter = column.valueGetter;

      if (column.type === "date" || column.type === "dateTime") {
        valueGetter = wrapWithDateValueGetter(valueGetter);
      }

      return {
        ...column,
        valueGetter,
      };
    });
  }, [columnsProp, dataProvider.fields]);

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
      {error ? (
        <CardSurface>
          <ErrorOverlay error={error} />
        </CardSurface>
      ) : null}
    </Box>
  );
}
