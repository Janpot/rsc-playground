"use client";

import { createDataProvider } from "@/lib/dash/client";
import dayjs from "dayjs";

const numberFormat = new Intl.NumberFormat();

export const CITIES = new Map([
  ["New York", { lat: 40.71, lon: -74.01, altitude: 10 }],
  ["San Diego", { lat: 32.71, lon: -117.16, altitude: 36 }],
  ["Anchorage", { lat: 61.22, lon: -149.89, altitude: 0 }],
  ["Winnipeg", { lat: 49.9, lon: -97.14, altitude: 236 }],
  ["Monterrey", { lat: 25.68, lon: -99.13, altitude: 2230 }],
  ["Baracoa", { lat: 20.35, lon: -74.5, altitude: 1 }],
]);

export type WeatherDatum = {
  id: string;
  city: string;
  time: string;
  temperature: number;
  wind: number;
  windDir: number;
  precipitation: number;
};

export const forecast = createDataProvider<WeatherDatum>({
  async getMany({ filter }) {
    const url = new URL(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact",
    );

    const cityName = filter.city?.eq;

    if (!cityName) {
      throw new Error("City name is required");
    }

    const city = CITIES.get(cityName);

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
      .map((item: any, index: number) => ({
        id: index,
        city: cityName,
        time: item.time,
        temperature: item.data?.instant?.details?.air_temperature,
        wind: item.data?.instant?.details?.wind_speed,
        windDir: item.data?.instant?.details?.wind_from_direction,
        precipitation: item.data?.next_1_hours?.details?.precipitation_amount,
      }));

    await new Promise((r) => setTimeout(r, 1000));

    return { rows };
  },
  fields: {
    time: {
      label: "Time",
      type: "date",
    },
    city: {
      label: "City",
    },
    temperature: {
      label: "Temperature",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(Number(value))}°C`,
    },
    wind: {
      label: "Wind",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(Number(value))}m/s`,
    },
    windDir: {
      label: "Wind Direction",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(Number(value))}°`,
    },
    precipitation: {
      label: "Precipitation",
      type: "number",
      valueFormatter: ({ value }) => `${numberFormat.format(Number(value))}mm`,
    },
  },
});
