"use server";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

const PROPERTY_ID = "353089763";

const analyticsDataClient = new BetaAnalyticsDataClient();

export async function fetchGaData() {
  const [response] = await analyticsDataClient.runReport({
    property: analyticsDataClient.propertyPath(PROPERTY_ID),
    dateRanges: [
      {
        startDate: "2020-03-31",
        endDate: "today",
      },
    ],
    dimensions: [
      {
        name: "city",
      },
    ],
    metrics: [
      {
        name: "activeUsers",
      },
    ],
  });

  return { rows: [{ id: 1, foo: "bar" }] };
}
