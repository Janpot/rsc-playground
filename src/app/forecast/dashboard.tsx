"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  GetManyParams,
  FilterSelect,
  createDataProvider,
  LineChart,
  FieldDef,
} from "@/lib/dash/client";
import { Box, Container, Stack } from "@mui/material";
import { FilterFieldDef } from "@/lib/dash/filter";
import { Metric } from "@/lib/dash/Metric";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import dayjs from "dayjs";

const numberFormat = new Intl.NumberFormat();

const CITIES = new Map([
  ["New York", { lat: 40.71, lon: -74.01, altitude: 10 }],
  ["San Diego", { lat: 32.71, lon: -117.16, altitude: 36 }],
  ["Anchorage", { lat: 61.22, lon: -149.89, altitude: 0 }],
  ["Winnipeg", { lat: 49.9, lon: -97.14, altitude: 236 }],
  ["Monterrey", { lat: 25.68, lon: -99.13, altitude: 2230 }],
  ["Baracoa", { lat: 20.35, lon: -74.5, altitude: 1 }],
]);

type WeatherDatum = {
  time: string;
  temperature: number;
  wind: number;
  windDir: number;
  precipitation: number;
};

const forecast = createDataProvider<WeatherDatum>({
  async getMany({ filter }: GetManyParams) {
    const url = new URL(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact",
    );

    const cityName = filter.find(
      (item) => item.field === "city" && item.operator === "eq",
    );

    if (!cityName) {
      throw new Error("City name is required");
    }

    const city = CITIES.get(cityName.value);

    if (!city) {
      throw new Error(`City not found: ${cityName}`);
    }

    if (cityName) {
      if (city) {
        url.searchParams.set("lat", String(city.lat));
        url.searchParams.set("lon", String(city.lon));
        url.searchParams.set("altitude", String(city.altitude));
      }
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${url}.`, {
        cause: await response.text(),
      });
    }

    const body = await response.json();

    const now = dayjs();
    const tomorrow = now.add(1, "day");
    const rows = body.properties.timeseries
      .filter((item: any) => {
        const date = dayjs(item.time);
        return date.isAfter(now) && date.isBefore(tomorrow);
      })
      .map((item: any) => ({
        time: item.time,
        temperature: item.data?.instant?.details?.air_temperature,
        wind: item.data?.instant?.details?.wind_speed,
        windDir: item.data?.instant?.details?.wind_from_direction,
        precipitation: item.data?.next_1_hours?.details?.precipitation_amount,
      }));

    await new Promise((r) => setTimeout(r, 1000));

    return { rows };
  },
  fields: [
    {
      field: "time",
      label: "Time",
      type: "date",
    },
    {
      field: "temperature",
      label: "Temperature",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(value)}°C`,
    },
    {
      field: "wind",
      label: "Wind",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(value)}m/s`,
    },
    {
      field: "windDir",
      label: "Wind Direction",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(value)}°`,
    },
    {
      field: "precipitation",
      label: "Precipitation",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(value)}mm`,
    },
  ],
});

const FILTER: FilterFieldDef[] = [
  { field: "city", defaultvalue: CITIES.keys().next().value },
];

const FORECAST_X_AXIS = [{ dataKey: "time" }];
const TEMPERATURE_SERIES = [{ dataKey: "temperature" }];
const WIND_SERIES = [{ dataKey: "wind" }];
const PRECIPITATION_SERIES = [{ dataKey: "precipitation" }];

export default function DashboardContent() {
  return (
    <Dashboard filter={FILTER}>
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Stack direction="row" spacing={2}>
            <FilterSelect options={Array.from(CITIES.keys())} field="city" />
          </Stack>
          <DataGrid dataProvider={forecast} pagination autoPageSize />
          <Box>
            <Grid2 container spacing={4}>
              <Grid2 xs={12} md={4}>
                <Metric
                  dataProvider={forecast}
                  field="temperature"
                  aggregation="average"
                />
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

/*
- data fetch
- data analytics pivot+charts
- AI
- performance + design execution
- headless
- depth
*/
