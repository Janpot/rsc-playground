"use client";

import {
  Box,
  Paper,
  Stack,
  SxProps,
  TextField,
  Typography,
} from "@mui/material";
import {
  ResponsiveChartContainer,
  BarPlot,
  ChartsXAxis,
  LinePlot,
  MarkPlot,
} from "@mui/x-charts";
import * as React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "../../resizablePanels";
import { title } from "process";
import type { GenerateContext } from "../../ClientDashboard";

interface DataSource {
  kind: "rest";
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: { name: string; value: string }[];
}

interface DashboardChartProps {
  title?: string;
  data?: DataSource;
}

interface DataSourceEditorProps {
  sx?: SxProps;
  value: DataSource;
  onChange: (value: DataSource) => void;
}

function DataSourceEditor({ sx, value, onChange }: DataSourceEditorProps) {
  return (
    <Stack sx={sx} spacing={2}>
      <TextField
        label="URL"
        value={value.url}
        onChange={(event) => onChange({ ...value, url: event.target.value })}
      />
      <TextField
        label="Method"
        value={value.method}
        onChange={(event) =>
          onChange({ ...value, method: event.target.value as any })
        }
      />
    </Stack>
  );
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

export function generateCode(
  name: string,
  props: DashboardChartProps,
  ctx: GenerateContext,
): string {
  ctx.useImport("@mui/material/Paper", { default: "Paper" });
  ctx.useImport("@mui/material/Typography", { default: "Typography" });
  ctx.useImport("@mui/x-charts", {
    ResponsiveChartContainer: "ResponsiveChartContainer",
    BarPlot: "BarPlot",
    LinePlot: "LinePlot",
    MarkPlot: "MarkPlot",
    ChartsXAxis: "ChartsXAxis",
  });
  return `
  function ${name} () {
    return (
      <Paper
        sx={{
          width: "100%",
          minHeight: 300,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography sx={{ mx: 2, my: 1 }}>${props.title ?? "(untitled)"}</Typography>
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
`;
}

const DEFAULT_DATASOURCE: DataSource = { kind: "rest" };

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
            <Panel defaultSize={30}>
              <DataSourceEditor
                value={input.data || DEFAULT_DATASOURCE}
                onChange={(value) => setInput({ ...input, data: value })}
              />
            </Panel>
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
