import * as z from "zod";

export const layoutSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export type Layout = z.infer<typeof layoutSchema>;

export const restDataProviderSchema = z.object({
  kind: z.literal("rest"),
  name: z.string(),
  method: z.string().default("GET"),
  url: z.string(),
  headers: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .default([]),
  dataPath: z.string(),
  columns: z
    .array(
      z.object({
        name: z.string(),
        path: z.string(),
      }),
    )
    .default([]),
});

export const dashboardConfigSchema = z.object({
  objects: z
    .record(
      z.object({
        kind: z.string(),
        props: z.any().optional(),
        layout: layoutSchema,
      }),
    )
    .default({}),
  data: z.record(restDataProviderSchema).default({}),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
