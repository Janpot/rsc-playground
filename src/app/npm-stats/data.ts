"use client";

import {
  createDataProvider,
  ValueFormatterParams,
} from "../../lib/dash/client";
import { Filter } from "@/lib/dash/filter";
import { fetchGaData } from "./serverData";
import dayjs from "dayjs";

const percentFormat = new Intl.NumberFormat(undefined, {
  style: "percent",
});

function percentFormatter({
  value,
}: ValueFormatterParams<any, string>): string {
  return percentFormat.format(Number(value));
}

function marketShare(
  downloads: number,
  reactDomDownloads: number,
): number | null {
  return reactDomDownloads > 0 ? downloads / reactDomDownloads : null;
}

async function fetchPackageNpmStats(packageName: string, filter: Filter<any>) {
  if (!filter.date?.gte || !filter.date?.lte) {
    throw new Error("date range is required");
  }

  const url = new URL(
    `https://api.npmjs.org/downloads/range/${encodeURIComponent(filter.date.gte)}:${encodeURIComponent(filter.date.lte)}/${encodeURIComponent(packageName)}`,
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

  return body.downloads;
}

export const dailyStats = createDataProvider({
  async getMany({ filter }) {
    const [
      muiMaterialDownloads,
      materialUiCoreDownloads,
      baseUiDownloads,
      reactDomDownloads,
    ] = await Promise.all([
      fetchPackageNpmStats("@mui/material", filter),
      fetchPackageNpmStats("@material-ui/core", filter),
      fetchPackageNpmStats("@mui/base", filter),
      fetchPackageNpmStats("react-dom", filter),
    ]);

    const aggregated = muiMaterialDownloads.map((item: any, i: number) => {
      const muiMaterialDownloadsCount: number = item.downloads;
      const materialUiCoreDownloadsCount: number =
        materialUiCoreDownloads[i].downloads;
      const baseUiDownloadsCount: number = baseUiDownloads[i].downloads;
      const reactDomDownloadsCount: number = reactDomDownloads[i].downloads;

      return {
        id: item.day,
        day: new Date(item.day),
        muiMaterialDownloadsCount,
        materialUiCoreDownloadsCount,
        baseUiDownloadsCount,
        reactDomDownloadsCount,
        coreMarketShare: marketShare(
          materialUiCoreDownloadsCount + muiMaterialDownloadsCount,
          reactDomDownloadsCount,
        ),
        baseUiMarketShare: marketShare(
          baseUiDownloadsCount,
          reactDomDownloadsCount,
        ),
      };
    });

    return {
      rows: aggregated,
    };
  },
  fields: {
    day: {
      label: "Day",
      type: "date",
    },
    muiMaterialDownloadsCount: {
      label: "@mui/material",
      type: "number",
    },
    materialUiCoreDownloadsCount: {
      label: "@material-ui/core",
      type: "number",
    },
    baseUiDownloadsCount: {
      label: "@mui/base",
      type: "number",
    },
    coreMarketShare: {
      label: "core Market Share",
      type: "number",
      valueFormatter: percentFormatter,
    },
    baseUiMarketShare: {
      label: "base Market Share",
      type: "number",
      valueFormatter: percentFormatter,
    },
  },
});

function arraySum(arr: number[]) {
  return arr.reduce((acc, value) => acc + value, 0);
}

export const monthlyStats = createDataProvider({
  ...dailyStats,
  async getMany(...params) {
    const result = await dailyStats.getMany(...params);

    const grouped = Object.groupBy(result.rows, (item: any) =>
      dayjs(item.day).format("YYYY-MM"),
    );

    const byMonth = (Object.entries(grouped) as [string, any[]][]).map(
      ([month, items]) => {
        const day = dayjs(month).format("YYYY-MM-DD");
        const muiMaterialDownloadsCount = arraySum(
          items.map((item) => item.muiMaterialDownloadsCount),
        );
        const materialUiCoreDownloadsCount = arraySum(
          items.map((item) => item.materialUiCoreDownloadsCount),
        );
        const baseUiDownloadsCount = arraySum(
          items.map((item) => item.baseUiDownloadsCount),
        );
        const reactDomDownloadsCount = arraySum(
          items.map((item) => item.reactDomDownloadsCount),
        );

        return {
          id: day,
          day,

          muiMaterialDownloadsCount,
          materialUiCoreDownloadsCount,
          baseUiDownloadsCount,
          reactDomDownloadsCount,
          coreMarketShare: marketShare(
            materialUiCoreDownloadsCount + muiMaterialDownloadsCount,
            reactDomDownloadsCount,
          ),
          baseUiMarketShare: marketShare(
            baseUiDownloadsCount,
            reactDomDownloadsCount,
          ),
        };
      },
    );

    return {
      ...result,
      rows: byMonth,
    };
  },
});

export const gaData = createDataProvider(fetchGaData);
