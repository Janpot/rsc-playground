import * as z from "zod";

export const layoutSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export type Layout = z.infer<typeof layoutSchema>;

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
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
