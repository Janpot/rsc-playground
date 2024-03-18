"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  LineChart,
  ParameterSelect,
  BarChart,
} from "@/lib/dash/client";
import { Box, Container, Stack, Toolbar, Typography } from "@mui/material";
import { createUrlParameter } from "@/lib/dash/filter";
import { Metric } from "@/lib/dash/Metric";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { CITIES, forecast } from "./data";

const cityParameter = createUrlParameter<string>("city", {
  defaultValue: CITIES.keys().next().value,
});

const FORECAST_X_AXIS = [{ dataKey: "time" }];

export default function DashboardContent() {
  return (
    <Dashboard
      bindings={[
        [
          forecast,
          {
            city: {
              eq: cityParameter,
            },
          },
        ],
      ]}
    >
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Toolbar disableGutters>
            <Typography variant="h4">Weather Forecast</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <ParameterSelect
              options={Array.from(CITIES.keys())}
              parameter={cityParameter}
            />
          </Toolbar>
          <DataGrid dataProvider={forecast} pagination autoPageSize />
          <Box>
            <Grid container spacing={4}>
              <Grid xs={12} md={4}>
                <Metric dataProvider={forecast} field="temperature" />
              </Grid>
              <Grid xs={12} md={4}>
                <Metric dataProvider={forecast} field="wind" />
              </Grid>
              <Grid xs={12} md={4}>
                <Metric dataProvider={forecast} field="precipitation" />
              </Grid>
            </Grid>
          </Box>
          <LineChart
            dataProvider={forecast}
            xAxis={FORECAST_X_AXIS}
            series={[{ dataKey: "temperature" }]}
          />
          <LineChart
            dataProvider={forecast}
            xAxis={FORECAST_X_AXIS}
            series={[{ dataKey: "wind", area: true }]}
          />
          <BarChart
            dataProvider={forecast}
            xAxis={FORECAST_X_AXIS}
            series={[{ dataKey: "precipitation" }]}
          />
        </Stack>
      </Container>
    </Dashboard>
  );
}
