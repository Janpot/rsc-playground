"use client";

import React from "react";
import {
  BarChart as XBarChart,
  BarChartProps as XBarChartProps,
  AxisConfig,
} from "@mui/x-charts";
import { Box, Typography } from "@mui/material";
import { Datum, ResolvedDataProvider, useGetMany } from "../data";
import { CardSurface, ErrorOverlay, LoadingOverlay } from "../components";

export interface BarChartProps<R extends Datum> extends XBarChartProps {
  title?: string;
  dataProvider: ResolvedDataProvider<R>;
}

export function BarChart<R extends Datum>({
  title,
  dataProvider,
  xAxis,
  series,
}: BarChartProps<R>) {
  const { data, loading, error } = useGetMany(dataProvider);
  const resolvedXAxis = React.useMemo(() => {
    return (
      xAxis?.map((axis) => {
        let defaults: Partial<AxisConfig> = {};
        if (axis.dataKey) {
          const field = dataProvider.fields[axis.dataKey];
          if (field) {
            defaults = {
              scaleType: "band",
              label: field.label,
            };
          }
        }
        return { ...defaults, ...axis };
      }) ?? []
    );
  }, [dataProvider.fields, xAxis]);
  console.log(resolvedXAxis);

  const resolvedSeries = React.useMemo(() => {
    return series.map((s) => {
      let defaults: Partial<XBarChartProps["series"][number]> = {};
      if (s.dataKey) {
        const name = s.dataKey;
        const field = dataProvider.fields[name];
        if (field) {
          defaults = {
            label: field.label,
          };
          const valueFormatter = field.valueFormatter;
          if (valueFormatter) {
            defaults.valueFormatter = (value: any) =>
              valueFormatter({ value, field: name });
          }
        }
      }
      return { ...defaults, ...s };
    });
  }, [series, dataProvider.fields]);

  const dataSet = React.useMemo(() => {
    const resolvedRows = data?.rows ?? [];
    return resolvedRows.map((row, i) => {
      const result: NonNullable<XBarChartProps["dataset"]>[number] = {};
      for (const [name, field] of Object.entries(dataProvider.fields)) {
        let value = row[name];
        if (
          field.type === "date" &&
          (typeof value === "string" || typeof value === "number")
        ) {
          value = new Date(value);
        }

        if (
          typeof value === "string" ||
          typeof value === "number" ||
          value instanceof Date
        ) {
          result[name] = value;
        }
      }
      return result;
    });
  }, [data?.rows, dataProvider.fields]);

  return (
    <CardSurface>
      {title ? (
        <Typography variant="h6" sx={{ padding: 2 }}>
          {title}
        </Typography>
      ) : null}
      <Box sx={{ position: "relative" }}>
        <XBarChart
          dataset={dataSet}
          xAxis={resolvedXAxis}
          series={dataSet.length > 0 ? resolvedSeries : []}
          height={300}
        />
        {loading ? <LoadingOverlay /> : null}
        {error ? <ErrorOverlay error={error} /> : null}
      </Box>
    </CardSurface>
  );
}
