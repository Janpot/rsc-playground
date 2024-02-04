"use client";

import { Box, Paper, TextField, Typography } from "@mui/material";
import {
  ResponsiveChartContainer,
  BarPlot,
  ChartsXAxis,
  LinePlot,
  MarkPlot,
} from "@mui/x-charts";
import * as React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "../resizablePanels";

interface ChartData {
  values: Record<string, unknown>[];
}

interface DashboardChartProps {
  title: string;
  data: ChartData[];
}

export default function DashboardChart({ title }: DashboardChartProps) {
  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography sx={{ mx: 2, my: 1 }}>{title}</Typography>
      <ResponsiveChartContainer
        series={[
          {
            type: "bar",
            data: [1, 2, 3, 2, 1],
          },
          {
            type: "line",
            data: [4, 3, 1, 3, 4],
            id: "line-1",
          },
          {
            type: "line",
            data: [4, 6, 1, 3, 4],
            id: "line-2",
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
        <LinePlot skipAnimation id="line-2" />
        <LinePlot id="line-1" />
        <MarkPlot skipAnimation />
        <ChartsXAxis label="X axis" position="bottom" axisId="x-axis-id" />
      </ResponsiveChartContainer>
    </Paper>
  );
}

interface EditorProps {
  value: DashboardChartProps;
  onChange: (value: DashboardChartProps) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  const [input, setInput] = React.useState(value);
  React.useEffect(() => {
    setInput(value);
  }, [value]);
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <PanelGroup direction="horizontal">
        <Panel>
          <PanelGroup direction="vertical">
            <Panel>
              <Box sx={{ width: "100%", height: "100%", p: 2 }}>
                <DashboardChart {...input} />
              </Box>
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={30}>data panel</Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={25}>
          <TextField
            label="title"
            value={value.title}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
          />
        </Panel>
      </PanelGroup>
    </Box>
  );
}
