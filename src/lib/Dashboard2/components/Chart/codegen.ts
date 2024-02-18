import type { DashboardChartProps } from ".";
import { ModuleContext } from "../../codegen";

export function generateCode(
  name: string,
  props: DashboardChartProps,
  ctx: ModuleContext,
): string {
  ctx.requireImport("@mui/material/Paper", { default: "Paper" });
  ctx.requireImport("@mui/material/Typography", { default: "Typography" });
  ctx.requireImport("@mui/x-charts", {
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
