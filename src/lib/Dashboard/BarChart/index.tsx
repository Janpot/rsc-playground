"use client";

import {
  ResponsiveChartContainer,
  BarPlot,
  ChartsXAxis,
  LinePlot,
  MarkPlot,
} from "@mui/x-charts";
import * as React from "react";

interface DashboardBarChartProps {}

export default function DashboardBarChart(props: DashboardBarChartProps) {
  return (
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
  );
}

interface EditorProps {
  value: DashboardBarChartProps;
  onChange: (value: DashboardBarChartProps) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  return (
    <div>
      <h1>BarChart Editor</h1>
    </div>
  );
}
