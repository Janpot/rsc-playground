"use client";

import React from "react";
import { PieChart as XPieChart } from "@mui/x-charts";
import { Box, Typography } from "@mui/material";
import { useDataProviderGetMany, ResolvedDataProvider, Datum } from "../data";
import { CardSurface, LoadingOverlay, ErrorOverlay } from "../components";

export interface PieChartProps<R extends Datum> {
  title?: string;
  dataProvider: ResolvedDataProvider<R>;
  dimension: string;
  label: string;
}

export function PieChart<R extends Datum>({
  dataProvider,
  dimension,
  label,
  title,
}: PieChartProps<R>) {
  const { data, isLoading, error } = useDataProviderGetMany(dataProvider);

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
    <CardSurface>
      {title ? (
        <Typography variant="h6" sx={{ padding: 2 }}>
          {title}
        </Typography>
      ) : null}
      <Box sx={{ position: "relative" }}>
        <XPieChart series={series} height={300} />
        {isLoading ? <LoadingOverlay /> : null}
        {error ? <ErrorOverlay error={error} /> : null}
      </Box>
    </CardSurface>
  );
}
