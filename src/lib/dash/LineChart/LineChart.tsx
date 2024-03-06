"use client";

import React from "react";
import {
  LineChart as XLineChart,
  LineChartProps as XLineChartProps,
  AxisConfig,
} from "@mui/x-charts";
import { Box, Paper, Typography, styled } from "@mui/material";
import { ResolvedDataProvider, useDataProviderGetMany } from "../data";
import { CardSurface, ErrorOverlay, LoadingOverlay } from "../components";

export interface LineChartProps extends XLineChartProps {
  title?: string;
  dataProvider: ResolvedDataProvider;
}

export function LineChart({
  title,
  dataProvider,
  xAxis,
  series,
}: LineChartProps) {
  const { data, isLoading, error } = useDataProviderGetMany(dataProvider);

  const fieldsMap = React.useMemo(() => {
    return new Map(dataProvider.fields.map((field) => [field.field, field]));
  }, [dataProvider.fields]);

  const resolvedXAxis = React.useMemo(() => {
    return (
      xAxis?.map((axis) => {
        let defaults: Partial<AxisConfig> = {};
        if (axis.dataKey) {
          const field = fieldsMap.get(axis.dataKey);
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
  }, [xAxis, fieldsMap]);

  const resolvedSeries = React.useMemo(() => {
    return series.map((s) => {
      let defaults: Partial<XLineChartProps["series"][number]> = {};
      if (s.dataKey) {
        const field = fieldsMap.get(s.dataKey);
        if (field) {
          defaults = {
            label: field.label,
          };
          const valueFormatter = field.valueFormatter;
          if (valueFormatter) {
            defaults.valueFormatter = (value: any) =>
              valueFormatter({ value, field: field.field });
          }
        }
      }
      return { ...defaults, ...s };
    });
  }, [series, fieldsMap]);

  const rows = React.useMemo(() => {
    const resolvedRows = data?.rows ?? [];
    return resolvedRows.map((row, i) => {
      const result = {
        ...row,
      };
      for (const field of dataProvider.fields) {
        if (field.type === "date") {
          result[field.field] = new Date(row[field.field]);
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
        {isLoading ? <LoadingOverlay /> : null}
        {error ? <ErrorOverlay error={error} /> : null}
      </Box>
    </CardSurface>
  );
}
