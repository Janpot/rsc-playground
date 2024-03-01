"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  DataProviderGridColDef,
  FetchDataParams,
  FilterDateRangePicker,
  FilterSelect,
} from "../../lib/dash/client";
import { Container } from "@mui/material";
import { FilterFieldDef, expandFilter, useFilter } from "@/lib/dash/filter";
import dayjs from "dayjs";

const RESOLUTION = ["Daily", "Monthly"];

async function forecast({ filter }: FetchDataParams) {
  const expanded = expandFilter(filter);

  if (!expanded.date.gte || !expanded.date.lte) {
    throw new Error("date range is required");
  }

  const url = new URL(
    `https://api.npmjs.org/downloads/range/${encodeURIComponent(expanded.date.gte)}:${encodeURIComponent(expanded.date.lte)}/@mui/material`,
  );

  const response = await fetch(url, {
    headers: {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}.`, {
      cause: await response.text(),
    });
  }

  const body = await response.json();

  let downloads = body.downloads;

  if (expanded.resolution.eq === "Monthly") {
    const grouped = Object.groupBy(downloads, (item) =>
      dayjs(item.day).format("YYYY-MM"),
    );
    downloads = Object.entries(grouped).map(([month, items]) => ({
      month,
      downloads: items.reduce((acc, item) => acc + item.downloads, 0),
    }));
  }

  return {
    rows: downloads,
  };
}

const today = dayjs();

const FILTER: FilterFieldDef[] = [
  {
    field: "resolution",
    defaultvalue: "Daily",
  },
  {
    field: "date",
    operator: "gte",
    defaultvalue: today.subtract(1, "year").format("YYYY-MM-DD"),
  },
  { field: "date", operator: "lte", defaultvalue: today.format("YYYY-MM-DD") },
];

const COLUMNS: DataProviderGridColDef[] = [
  {
    field: "day",
    headerName: "Day",
    type: "date",
  },
  {
    field: "month",
    headerName: "Month",
    type: "date",
  },
  {
    field: "downloads",
    headerName: "Downloads",
    type: "number",
  },
];

export default function Hello() {
  const filter = useFilter(FILTER);
  return (
    <Dashboard>
      <Container sx={{ mt: 5 }}>
        <FilterDateRangePicker filter={filter} field="date" />
        <FilterSelect options={RESOLUTION} filter={filter} field="resolution" />
        <DataGrid
          dataProvider={forecast}
          columns={COLUMNS}
          filter={filter}
          pagination
          autoPageSize
        />
      </Container>
    </Dashboard>
  );
}
