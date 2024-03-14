"use client";

import React from "react";
import {
  LineChart as XLineChart,
  LineChartProps as XLineChartProps,
  AxisConfig,
} from "@mui/x-charts";
import { Box, Paper, Typography, styled } from "@mui/material";
import { Datum, ResolvedDataProvider, useGetMany } from "../data";
import { CardSurface, ErrorOverlay, LoadingOverlay } from "../components";

export interface LineChartProps<R extends Datum> extends XLineChartProps {
  title?: string;
  dataProvider: ResolvedDataProvider<R>;
}

export function LineChart<R extends Datum>({
  title,
  dataProvider,
  xAxis,
  series,
}: LineChartProps<R>) {
  const { data, loading, error } = useGetMany(dataProvider);
  const resolvedXAxis = React.useMemo(() => {
    return (
      xAxis?.map((axis) => {
        let defaults: Partial<AxisConfig> = {};
        if (axis.dataKey) {
          const field = dataProvider.fields[axis.dataKey];
          if (field) {
            defaults = {
              label: field.label,
            };
            if (field.type === "date") {
              defaults.scaleType = "time";
            }
          }
        }
        return { ...defaults, ...axis };
      }) ?? []
    );
  }, [dataProvider.fields, xAxis]);

  const resolvedSeries = React.useMemo(() => {
    return series.map((s) => {
      let defaults: Partial<XLineChartProps["series"][number]> = {};
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

  const rows = React.useMemo(() => {
    const resolvedRows = data?.rows ?? [];
    return resolvedRows.map((row, i) => {
      // @ts-expect-error TODO better types of R
      const result: NonNullable<XLineChartProps["dataset"]>[number] = {
        ...row,
      };
      for (const [name, field] of Object.entries(dataProvider.fields)) {
        if (field.type === "date") {
          // @ts-expect-error TODO better types of R
          result[name] = new Date(row[name]);
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
        <XLineChart
          dataset={rows}
          xAxis={resolvedXAxis}
          series={resolvedSeries}
          height={300}
        />
        {loading ? <LoadingOverlay /> : null}
        {error ? <ErrorOverlay error={error} /> : null}
      </Box>
    </CardSurface>
  );
}
