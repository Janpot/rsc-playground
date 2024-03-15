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
  useGetMany,
} from "../data";
import { CardSurface, ErrorOverlay, LoadingOverlay } from "../components";

export interface DataGridProps<R extends Datum>
  extends Pick<
    DataGridProProps<R>,
    "getRowId" | "pagination" | "autoPageSize" | "onRowClick"
  > {
  columns?: readonly GridColDef<R>[];
  dataProvider: ResolvedDataProvider<R>;
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
  fields: { [K in keyof R & string]: Omit<ResolvedField<R, K>, "field"> },
  columnsProp?: readonly GridColDef<R>[],
): readonly GridColDef<R>[] {
  const resolvedColumns =
    columnsProp ??
    Object.entries(fields).map(([name, field]) => {
      const colDef: GridColDef<R> = {
        field: name,
        type: field.type,
        headerName: field.label,
      };
      const valueFormatter = field.valueFormatter;
      if (valueFormatter) {
        colDef.valueFormatter = valueFormatter;
      }
      return colDef;
    });

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
}

export function DataGrid<R extends Datum>({
  dataProvider,
  columns: columnsProp,
  getRowId: getRowIdProp,
  ...props
}: DataGridProps<R>) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const { data, loading, error } = useGetMany(dataProvider);

  const columns = React.useMemo(
    () => getColumnsFromFields(dataProvider.fields, columnsProp),
    [columnsProp, dataProvider.fields],
  );

  const rows = React.useMemo(() => {
    return data?.rows.map((row, index) => ({ ...row, _index: index })) ?? [];
  }, [data]);

  const getRowId = React.useMemo(() => {
    return (
      getRowIdProp ??
      ((row: any) => {
        return Object.prototype.hasOwnProperty.call(row, "id")
          ? row.id
          : row._index;
      })
    );
  }, [getRowIdProp]);

  return (
    <Box sx={{ height: 400, position: "relative" }}>
      {mounted ? (
        <>
          <DataGridPro
            getRowId={getRowId}
            rows={rows}
            columns={columns}
            loading={loading}
            {...props}
          />
          {error ? (
            <CardSurface sx={{ position: "absolute", inset: "0 0 0 0" }}>
              <ErrorOverlay error={error} />
            </CardSurface>
          ) : null}
        </>
      ) : (
        <CardSurface sx={{ position: "absolute", inset: "0 0 0 0" }}>
          <LoadingOverlay />
        </CardSurface>
      )}
    </Box>
  );
}
