"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  ParameterDateRangePicker,
  ParameterSelect,
  LineChart,
  LineChartProps,
  createDataProvider,
} from "@/lib/dash/client";
import { Box, Container, Stack, Typography } from "@mui/material";
import {
  FilterBinding,
  createUrlParameter,
  useParameterValue,
} from "@/lib/dash/filter";
import dayjs from "dayjs";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { dailyStats, gaData, monthlyStats } from "./data";

const RESOLUTION = ["Daily", "Monthly"] as const;
type Resolution = (typeof RESOLUTION)[number];

const X_AXIS = [
  {
    dataKey: "day",
  },
] satisfies LineChartProps<any>["xAxis"];

const CORE_DOWNLOADS_SERIES = [
  {
    dataKey: "muiMaterialDownloadsCount",
    showMark: false,
  },
  {
    dataKey: "materialUiCoreDownloadsCount",
    showMark: false,
  },
] satisfies LineChartProps<any>["series"];

const CORE_MARKET_SHARE_SERIES = [
  {
    dataKey: "coreMarketShare",
    showMark: false,
  },
] satisfies LineChartProps<any>["series"];

const BASE_DOWNLOADS_SERIES = [
  {
    dataKey: "baseUiDownloadsCount",
    showMark: false,
  },
] satisfies LineChartProps<any>["series"];

const BSE_MARKET_SHARE_SERIES = [
  {
    dataKey: "baseUiMarketShare",
    showMark: false,
  },
] satisfies LineChartProps<any>["series"];

const GA_DATA_COLUMNS = [
  {
    field: "foo",
  },
];

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

const PARAMETER_BINDINGS: FilterBinding<any>[] = [
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
];

export default function DashboardContent() {
  const resolution = useParameterValue(resolutionParameter);
  const dataProvider = resolution === "Daily" ? dailyStats : monthlyStats;

  return (
    <Dashboard bindings={PARAMETER_BINDINGS}>
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Box>
            <Typography variant="h4">NPM Stats</Typography>
          </Box>
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
          <DataGrid dataProvider={dataProvider} pagination autoPageSize />
          <Box>
            <Grid2 container spacing={4}>
              <Grid2 xs={12} md={6}>
                <LineChart
                  title="Material UI (@mui/material)"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={CORE_DOWNLOADS_SERIES}
                />
              </Grid2>
              <Grid2 xs={12} md={6}>
                <LineChart
                  title="Base UI (@mui/base)"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={BASE_DOWNLOADS_SERIES}
                />
              </Grid2>
              <Grid2 xs={12} md={6}>
                <LineChart
                  title="Material UI React DOM marketshare"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={CORE_MARKET_SHARE_SERIES}
                />
              </Grid2>
              <Grid2 xs={12} md={6}>
                <LineChart
                  title="Base UI React DOM marketshare"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={BSE_MARKET_SHARE_SERIES}
                />
              </Grid2>
            </Grid2>
          </Box>
          <DataGrid
            dataProvider={gaData}
            columns={GA_DATA_COLUMNS}
            pagination
            autoPageSize
          />
        </Stack>
      </Container>
    </Dashboard>
  );
}
