import * as React from "react";
import * as fs from "fs/promises";
import ClientDashboard, { DashboardComponent } from "./ClientDashboard";
import { DashboardConfig, dashboardConfigSchema } from "./schema";
import BarChart, { Editor as BarChartEditor } from "./BarChart";

async function getDashboardConfig(filePath: string): Promise<DashboardConfig> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(content);
    return dashboardConfigSchema.parse(json);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {
        objects: {},
      };
    }
    throw err;
  }
}

const DEFAULT_COMPONENTS = new Map([
  [
    "BarChart",
    {
      Component: BarChart,
      Editor: BarChartEditor,
    },
  ],
]);

export interface DashboardProps {
  file: string;
  editable: boolean;
  components?: Map<string, DashboardComponent>;
}

export async function Dashboard({
  file,
  editable,
  components = DEFAULT_COMPONENTS,
}: DashboardProps) {
  const content = await getDashboardConfig(file);

  async function saveConfig(config: DashboardConfig) {
    "use server";

    await fs.writeFile(file, JSON.stringify(config, null, 2));
  }

  return (
    <ClientDashboard
      value={content}
      saveConfig={editable ? saveConfig : undefined}
      components={components}
    />
  );
}
