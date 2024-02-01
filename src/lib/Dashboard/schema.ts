import * as z from "zod";

export const dashboardConfigSchema = z.object({
  objects: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      kind: z.string(),
      props: z.any().optional(),
    }),
  ),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
