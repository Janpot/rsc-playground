"use client";

import { ModuleContext } from "../codegen";
import { Editor as ChartEditor } from "./Chart";
import { generateCode as generateChartCode } from "./Chart/codegen";
import { Editor as DataGridEditor } from "./DataGrid";
import { generateCode as generateDataGridCode } from "./DataGrid/codegen";

export interface EditorProps<P> {
  value: P;
  onChange: (value: P) => void;
}

export interface DashboardComponent<P = {}> {
  Editor: React.ComponentType<EditorProps<P>>;
  initialProps: P;
  generateCode?: (name: string, props: P, ctx: ModuleContext) => string;
}

const components = new Map<string, DashboardComponent>([
  [
    "Chart",
    {
      Editor: ChartEditor,
      initialProps: {},
      generateCode: generateChartCode,
    },
  ],
  [
    "DataGrid",
    {
      Editor: DataGridEditor,
      initialProps: {},
      generateCode: generateDataGridCode,
    },
  ],
]);

export default components;
