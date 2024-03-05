"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  DataProviderGridColDef,
  GetManyParams,
  FilterDateRangePicker,
  FilterSelect,
  LineChart,
  LineChartProps,
} from "../../lib/dash/client";
import { Container, Stack } from "@mui/material";
import {
  ExpandedFilter,
  FilterFieldDef,
  expandFilter,
} from "@/lib/dash/filter";
import dayjs from "dayjs";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { gaData } from "./data";

const RESOLUTION = ["Daily", "Monthly"];

async function fetchPackageNpmStats(
  packageName: string,
  expanded: ExpandedFilter,
) {
  if (!expanded.date.gte || !expanded.date.lte) {
    throw new Error("date range is required");
  }

  const url = new URL(
    `https://api.npmjs.org/downloads/range/${encodeURIComponent(expanded.date.gte)}:${encodeURIComponent(expanded.date.lte)}/${encodeURIComponent(packageName)}`,
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
    downloads = Object.entries(grouped).map(([day, items]) => ({
      day: dayjs(day).format("YYYY-MM-DD"),
      downloads: items.reduce((acc, item) => acc + item.downloads, 0),
    }));
  }

  return downloads;
}

async function npmStats({ filter }: GetManyParams) {
  const expanded = expandFilter(filter);

  const [
    muiMaterialDownloads,
    materialUiCoreDownloads,
    baseUiDownloads,
    reactDomDownloads,
  ] = await Promise.all([
    fetchPackageNpmStats("@mui/material", expanded),
    fetchPackageNpmStats("@material-ui/core", expanded),
    fetchPackageNpmStats("@mui/base", expanded),
    fetchPackageNpmStats("react-dom", expanded),
  ]);

  const aggregated = muiMaterialDownloads.map((item, i) => {
    const muiMaterialDownloadsCount: number = item.downloads;
    const materialUiCoreDownloadsCount: number =
      materialUiCoreDownloads[i].downloads;
    const baseUiDownloadsCount: number = baseUiDownloads[i].downloads;
    const reactDomDownloadsCount: number = reactDomDownloads[i].downloads;

    return {
      day: new Date(item.day),
      muiMaterialDownloadsCount,
      materialUiCoreDownloadsCount,
      baseUiDownloadsCount,
      coreMarketShare:
        reactDomDownloadsCount > 0
          ? (materialUiCoreDownloadsCount + muiMaterialDownloadsCount) /
            reactDomDownloadsCount
          : null,
      baseUiMarketShare:
        reactDomDownloadsCount > 0
          ? baseUiDownloadsCount / reactDomDownloadsCount
          : null,
    };
  });

  return {
    rows: aggregated,
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
    field: "muiMaterialDownloadsCount",
    headerName: "@mui/material Downloads",
    type: "number",
  },
  {
    field: "materialUiCoreDownloadsCount",
    headerName: "@material-ui/core Downloads",
    type: "number",
  },
  {
    field: "baseUiDownloadsCount",
    headerName: "@mui/base Downloads",
    type: "number",
  },
  {
    field: "coreMarketShare",
    headerName: "core Market Share",
    type: "number",
  },
  {
    field: "baseUiMarketShare",
    headerName: "base Market Share",
    type: "number",
  },
];

const X_AXIS = [
  {
    dataKey: "day",
    scaleType: "time",
  },
] satisfies LineChartProps["xAxis"];

const CORE_DOWNLOADS_SERIES = [
  {
    dataKey: "muiMaterialDownloadsCount",
    label: "@mui/material",
    showMark: false,
  },
  {
    dataKey: "materialUiCoreDownloadsCount",
    label: "@material-ui/core",
    showMark: false,
  },
] satisfies LineChartProps["series"];

const CORE_MARKET_SHARE_SERIES = [
  {
    dataKey: "coreMarketShare",
    label: "core marketshare",
    showMark: false,
  },
] satisfies LineChartProps["series"];

const BASE_DOWNLOADS_SERIES = [
  {
    dataKey: "baseUiDownloadsCount",
    label: "@mui/base",
    showMark: false,
  },
] satisfies LineChartProps["series"];

const BSE_MARKET_SHARE_SERIES = [
  {
    dataKey: "baseUiMarketShare",
    label: "base marketshare",
    showMark: false,
  },
] satisfies LineChartProps["series"];

const GA_DATA_COLUMNS = [
  {
    field: "foo",
  },
];

export default function DashboardContent() {
  return (
    <Dashboard filter={FILTER}>
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Stack direction="row" spacing={2}>
            <FilterDateRangePicker field="date" />
            <FilterSelect options={RESOLUTION} field="resolution" />
          </Stack>
          <DataGrid
            dataProvider={npmStats}
            columns={COLUMNS}
            pagination
            autoPageSize
          />
          <DataGrid
            dataProvider={gaData}
            columns={GA_DATA_COLUMNS}
            pagination
            autoPageSize
          />
          <Grid2 container spacing={4}>
            <Grid2 xs={12} md={6}>
              <LineChart
                title="Material UI (@mui/material)"
                dataProvider={npmStats}
                xAxis={X_AXIS}
                series={CORE_DOWNLOADS_SERIES}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <LineChart
                title="Base UI (@mui/base)"
                dataProvider={npmStats}
                xAxis={X_AXIS}
                series={BASE_DOWNLOADS_SERIES}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <LineChart
                title="Material UI React DOM marketshare"
                dataProvider={npmStats}
                xAxis={X_AXIS}
                series={CORE_MARKET_SHARE_SERIES}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <LineChart
                title="Base UI React DOM marketshare"
                dataProvider={npmStats}
                xAxis={X_AXIS}
                series={BSE_MARKET_SHARE_SERIES}
              />
            </Grid2>
          </Grid2>
        </Stack>
      </Container>
    </Dashboard>
  );
}
