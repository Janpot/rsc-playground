"use client";

import { Box, TextField, Typography } from "@mui/material";
import {
  ResponsiveChartContainer,
  BarPlot,
  ChartsXAxis,
  LinePlot,
  MarkPlot,
} from "@mui/x-charts";
import * as React from "react";

interface DashboardBarChartProps {
  title: string;
}

export default function DashboardBarChart({ title }: DashboardBarChartProps) {
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Typography>{title}</Typography>
      <ResponsiveChartContainer
        series={[
          {
            type: "bar",
            data: [1, 2, 3, 2, 1],
          },
          {
            type: "line",
            data: [4, 3, 1, 3, 4],
          },
        ]}
        xAxis={[
          {
            data: ["A", "B", "C", "D", "E"],
            scaleType: "band",
            id: "x-axis-id",
          },
        ]}
      >
        <BarPlot skipAnimation />
        <LinePlot skipAnimation />
        <MarkPlot skipAnimation />
        <ChartsXAxis label="X axis" position="bottom" axisId="x-axis-id" />
      </ResponsiveChartContainer>
    </Box>
  );
}

interface EditorProps {
  value: DashboardBarChartProps;
  onChange: (value: DashboardBarChartProps) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  return (
    <div>
      <TextField
        label="title"
        value={value.title}
        onChange={(event) => onChange({ ...value, title: event.target.value })}
      />
    </div>
  );
}
