"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  ParameterDateRangePicker,
  ParameterSelect,
  LineChart,
  LineChartProps,
} from "@/lib/dash/client";
import { Box, Container, Stack, Typography } from "@mui/material";
import { createUrlParameter, useParameterValue } from "@/lib/dash/filter";
import dayjs from "dayjs";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { dailyStats, gaData, monthlyStats } from "./data";

const RESOLUTION = ["Daily", "Monthly"] as const;
type Resolution = (typeof RESOLUTION)[number];

const X_AXIS = [
  {
    dataKey: "day",
  },
] satisfies LineChartProps<any>["xAxis"];

const resolutionParameter = createUrlParameter<Resolution>("resolution", {
  defaultValue: "Daily",
});

const today = dayjs();

const startParameter = createUrlParameter("start", {
  defaultValue: today.subtract(1, "year").format("YYYY-MM-DD"),
});

const endParameter = createUrlParameter("end", {
  defaultValue: today.format("YYYY-MM-DD"),
});

export default function DashboardContent() {
  const resolution = useParameterValue(resolutionParameter);
  const dataProvider = resolution === "Daily" ? dailyStats : monthlyStats;

  return (
    <Dashboard
      bindings={[
        [
          dailyStats,
          {
            date: {
              gte: startParameter,
              lte: endParameter,
            },
          },
        ],
        [
          monthlyStats,
          {
            date: {
              gte: startParameter,
              lte: endParameter,
            },
          },
        ],
      ]}
    >
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Box>
            <Typography variant="h4">NPM Stats</Typography>
            <Stack direction="row" spacing={2}>
              <ParameterDateRangePicker
                start={startParameter}
                end={endParameter}
              />
              <ParameterSelect
                options={RESOLUTION}
                parameter={resolutionParameter}
              />
            </Stack>
          </Box>
          <Box>
            <Grid container spacing={4}>
              <Grid xs={12}>
                <DataGrid dataProvider={dataProvider} pagination autoPageSize />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Material UI (@mui/material)"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "muiMaterialDownloadsCount",
                      showMark: false,
                    },
                    {
                      dataKey: "materialUiCoreDownloadsCount",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Base UI (@mui/base)"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "baseUiDownloadsCount",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Material UI React DOM marketshare"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "coreMarketShare",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Base UI React DOM marketshare"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "baseUiMarketShare",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12}>
                <DataGrid dataProvider={gaData} pagination autoPageSize />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}
