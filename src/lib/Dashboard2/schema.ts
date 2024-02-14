import * as z from "zod";

export const dashboardConfigSchema = z.object({
  layout: z
    .object({
      rows: z.array(
        z.object({
          items: z.array(
            z.object({
              id: z.string(),
            }),
          ),
        }),
      ),
    })
    .default({ rows: [] }),
  objects: z.record(
    z.object({
      kind: z.string(),
      props: z.any().optional(),
    }),
  ),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
