"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  DataProviderGridColDef,
  GetManyParams,
  FilterSelect,
} from "../../lib/dash/client";
import { Container, Stack } from "@mui/material";
import { FilterFieldDef } from "@/lib/dash/filter";

const CITIES = new Map([
  ["New York", { lat: 40.71, lon: -74.01, altitude: 10 }],
  ["San Diego", { lat: 32.71, lon: -117.16, altitude: 36 }],
  ["Anchorage", { lat: 61.22, lon: -149.89, altitude: 0 }],
  ["Winnipeg", { lat: 49.9, lon: -97.14, altitude: 236 }],
  ["Monterrey", { lat: 25.68, lon: -99.13, altitude: 2230 }],
  ["Baracoa", { lat: 20.35, lon: -74.5, altitude: 1 }],
]);

async function forecast({ filter }: GetManyParams) {
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

  const response = await fetch(url, {
    headers: {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}.`, {
      cause: await response.text(),
    });
  }

  const body = await response.json();

  const rows = body.properties.timeseries.map((item: any, index: number) => ({
    time: item.time,
    temperature: item.data?.instant?.details?.air_temperature,
    wind: item.data?.instant?.details?.wind_speed,
    windDir: item.data?.instant?.details?.wind_from_direction,
    precipitation: item.data?.next_1_hours?.details?.precipitation_amount,
  }));

  return { rows };
}

const FILTER: FilterFieldDef[] = [
  { field: "city", defaultvalue: CITIES.keys().next().value },
];

const COLUMNS: DataProviderGridColDef[] = [
  {
    field: "time",
    headerName: "Time",
    type: "date",
  },
  {
    field: "temperature",
    headerName: "Temperature",
    type: "number",
  },
  {
    field: "wind",
    headerName: "Wind",
    type: "number",
  },
  {
    field: "windDir",
    headerName: "Wind Direction",
    type: "number",
  },
  {
    field: "precipitation",
    headerName: "Precipitation",
    type: "number",
  },
];

export default function DashboardContent() {
  return (
    <Dashboard filter={FILTER}>
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={2}>
          <FilterSelect options={Array.from(CITIES.keys())} field="city" />
          <DataGrid
            dataProvider={forecast}
            columns={COLUMNS}
            pagination
            autoPageSize
          />
        </Stack>
      </Container>
    </Dashboard>
  );
}
