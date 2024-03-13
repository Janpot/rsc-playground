"use client";

import {
  createDataProvider,
  ValueFormatterParams,
} from "../../lib/dash/client";
import { ExpandedFilter, expandFilter } from "@/lib/dash/filter";
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

  return body.downloads;
}

export const dailyStats = createDataProvider({
  async getMany({ filter }) {
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

    const aggregated = muiMaterialDownloads.map((item: any, i: number) => {
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
  fields: [
    {
      field: "day",
      label: "Day",
      type: "date",
    },
    {
      field: "muiMaterialDownloadsCount",
      label: "@mui/material",
      type: "number",
    },
    {
      field: "materialUiCoreDownloadsCount",
      label: "@material-ui/core",
      type: "number",
    },
    {
      field: "baseUiDownloadsCount",
      label: "@mui/base",
      type: "number",
    },
    {
      field: "coreMarketShare",
      label: "core Market Share",
      type: "number",
      valueFormatter: percentFormatter,
    },
    {
      field: "baseUiMarketShare",
      label: "base Market Share",
      type: "number",
      valueFormatter: percentFormatter,
    },
  ],
});

function arraySum(arr: number[]) {
  return arr.reduce((acc, value) => acc + value, 0);
}

export const monthlyStats = createDataProvider({
  ...dailyStats,
  async getMany(...params) {
    const result = await dailyStats.getMany(...params);

    // @ts-expect-error
    const grouped = Object.groupBy(result.rows, (item: any) =>
      dayjs(item.day).format("YYYY-MM"),
    );

    const byMonth = (Object.entries(grouped) as [string, any[]][]).map(
      ([day, items]) => {
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
          day: dayjs(day).format("YYYY-MM-DD"),

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
