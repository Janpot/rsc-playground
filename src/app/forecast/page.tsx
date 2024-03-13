"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  LineChart,
  ParameterSelect,
} from "@/lib/dash/client";
import { Box, Container, Stack } from "@mui/material";
import { FilterBinding, createUrlParameter } from "@/lib/dash/filter";
import { Metric } from "@/lib/dash/Metric";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { CITIES, forecast } from "./data";

const cityParameter = createUrlParameter<string>("city", {
  defaultValue: CITIES.keys().next().value,
});

const FILTER_BINDINGS: FilterBinding<any>[] = [
  [
    forecast,
    {
      city: {
        eq: cityParameter,
      },
    },
  ],
];

const FORECAST_X_AXIS = [{ dataKey: "time" }];
const TEMPERATURE_SERIES = [{ dataKey: "temperature" }];
const WIND_SERIES = [{ dataKey: "wind" }];
const PRECIPITATION_SERIES = [{ dataKey: "precipitation" }];

export default function DashboardContent() {
  return (
    <Dashboard bindings={FILTER_BINDINGS}>
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Stack direction="row" spacing={2}>
            <ParameterSelect
              options={Array.from(CITIES.keys())}
              parameter={cityParameter}
            />
          </Stack>
          <DataGrid dataProvider={forecast} pagination autoPageSize />
          <Box>
            <Grid2 container spacing={4}>
              <Grid2 xs={12} md={4}>
                <Metric dataProvider={forecast} field="temperature" />
              </Grid2>
              <Grid2 xs={12} md={4}>
                <Metric dataProvider={forecast} field="wind" />
              </Grid2>
              <Grid2 xs={12} md={4}>
                <Metric dataProvider={forecast} field="precipitation" />
              </Grid2>
            </Grid2>
          </Box>
          <LineChart
            dataProvider={forecast}
            xAxis={FORECAST_X_AXIS}
            series={TEMPERATURE_SERIES}
          />
          <LineChart
            dataProvider={forecast}
            xAxis={FORECAST_X_AXIS}
            series={WIND_SERIES}
          />
          <LineChart
            dataProvider={forecast}
            xAxis={FORECAST_X_AXIS}
            series={PRECIPITATION_SERIES}
          />
        </Stack>
      </Container>
    </Dashboard>
  );
}
