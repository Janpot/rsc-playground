import * as z from "zod";

const layoutSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

const layoutsSchema = z.array(layoutSchema);

const responsiveLayoutSchema = z.record(layoutsSchema);

export const dashboardConfigSchema = z.object({
  layouts: responsiveLayoutSchema,
  objects: z.record(
    z.object({
      kind: z.string(),
      props: z.any().optional(),
    }),
  ),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
