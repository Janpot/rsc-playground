"use client";

import * as React from "react";
import { Dashboard, DataGrid, LineChart, BarChart } from "@/lib/dash/client";
import {
  Box,
  Container,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useUrlQueryParameterState } from "@/lib/dash/filter";
import { Metric } from "@/lib/dash/Metric";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { CITIES, forecast } from "./data";
import { MenuItem } from "@mui/material";

const FORECAST_X_AXIS = [{ dataKey: "time" }];

const DEFAULT_CITY = [...CITIES.keys()][0];

export default function DashboardContent() {
  const [city, setCity] = useUrlQueryParameterState("city", {
    defaultValue: DEFAULT_CITY,
  });

  return (
    <Dashboard
      bindings={[
        [
          forecast,
          {
            city: {
              eq: city,
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
            <TextField
              select
              label="City"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              {Array.from(CITIES.keys(), (city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </TextField>
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
