"use client";

import * as React from "react";
import {
  Dashboard,
  DataGrid,
  LineChart,
  LineChartProps,
} from "@/lib/dash/client";
import {
  Box,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useUrlQueryParameterState } from "@/lib/dash/filter";
import dayjs from "dayjs";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { dailyStats, gaData, monthlyStats } from "./data";
import { DateRangePicker } from "@mui/x-date-pickers-pro";

type Range = [dayjs.Dayjs | null, dayjs.Dayjs | null];

const RESOLUTION = ["Daily", "Monthly"] as const;
type Resolution = (typeof RESOLUTION)[number];

const X_AXIS = [
  {
    dataKey: "day",
  },
] satisfies LineChartProps<any>["xAxis"];

const today = dayjs();

const dayjsCodec = {
  stringify: (value: dayjs.Dayjs) => value.format("YYYY-MM-DD"),
  parse: (value: string) => dayjs(value),
};

export default function DashboardContent() {
  const [resolution, setResolution] = useUrlQueryParameterState<Resolution>(
    "resolution",
    {
      defaultValue: "Daily",
    },
  );

  const dataProvider = resolution === "Daily" ? dailyStats : monthlyStats;

  const [start, setStart] = useUrlQueryParameterState("start", {
    defaultValue: today.subtract(1, "year"),
    codec: dayjsCodec,
  });

  const [end, setEnd] = useUrlQueryParameterState("end", {
    defaultValue: today,
    codec: dayjsCodec,
  });

  const range: Range = React.useMemo(() => [start, end], [start, end]);

  const setRange = React.useCallback(
    (newRange: Range) => {
      setStart(newRange[0]);
      setEnd(newRange[1]);
    },
    [setStart, setEnd],
  );

  const dataFilter = React.useMemo(
    () => ({
      date: {
        gte: start?.format("YYYY-MM-DD"),
        lte: end?.format("YYYY-MM-DD"),
      },
    }),
    [end, start],
  );

  return (
    <Dashboard
      bindings={[
        [dailyStats, dataFilter],
        [monthlyStats, dataFilter],
      ]}
    >
      <Container sx={{ mt: 5 }}>
        <Stack direction="column" spacing={4}>
          <Typography variant="h4">NPM Stats</Typography>
          <Box>
            <Stack direction="row" spacing={2}>
              <DateRangePicker value={range} onChange={setRange} />
              <TextField
                select
                label="Resolution"
                value={resolution}
                onChange={(event) =>
                  setResolution(event.target.value as Resolution)
                }
              >
                {RESOLUTION.map((resolution) => (
                  <MenuItem key={resolution} value={resolution}>
                    {resolution}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>
          <Box>
            <Grid container spacing={4}>
              <Grid xs={12}>
                <DataGrid dataProvider={dataProvider} pagination autoPageSize />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Material UI (@mui/material)"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "muiMaterialDownloadsCount",
                      showMark: false,
                    },
                    {
                      dataKey: "materialUiCoreDownloadsCount",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Base UI (@mui/base)"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "baseUiDownloadsCount",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Material UI React DOM marketshare"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "coreMarketShare",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <LineChart
                  title="Base UI React DOM marketshare"
                  dataProvider={dataProvider}
                  xAxis={X_AXIS}
                  series={[
                    {
                      dataKey: "baseUiMarketShare",
                      showMark: false,
                    },
                  ]}
                />
              </Grid>
              <Grid xs={12}>
                <DataGrid dataProvider={gaData} pagination autoPageSize />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}
