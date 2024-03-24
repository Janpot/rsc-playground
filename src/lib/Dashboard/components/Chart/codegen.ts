import type { DashboardChartProps } from ".";
import { ModuleContext } from "../../codegen";

export function generateCode(
  name: string,
  props: DashboardChartProps,
  ctx: ModuleContext,
): string {
  ctx.requireImport("@mui/material/Box", { default: "Box" });
  ctx.requireImport("@mui/material/Card", { default: "Card" });
  ctx.requireImport("@mui/material/CardContent", { default: "CardContent" });
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
      <Card variant="outlined" sx={{ width: "100%", height: "100%" }}>
        <CardContent sx={{ width: "100%", height: "100%", display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ mx: 2, my: 1 }}>${props.title ?? "(untitled)"}</Typography>
        <Box sx={{ flex: 1, minHeight: 0 }}>
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
          <LinePlot id="line-2" />
          <LinePlot id="line-1" />
          <MarkPlot  />
          <ChartsXAxis label="X axis" position="bottom" axisId="x-axis-id" />
        </ResponsiveChartContainer>
        </Box>
        </CardContent>
      </Card>
    );
  }
`;
}
