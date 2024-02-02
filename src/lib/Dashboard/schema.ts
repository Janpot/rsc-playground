import * as z from "zod";

const objectLayoutsSchema = z.record(
  z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
);

export type ObjectLayouts = z.infer<typeof objectLayoutsSchema>;

export const dashboardConfigSchema = z.object({
  objects: z.record(
    z.object({
      layouts: objectLayoutsSchema,
      kind: z.string(),
      props: z.any().optional(),
    }),
  ),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
