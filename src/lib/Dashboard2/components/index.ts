import type { GenerateContext } from "../ClientDashboard";
import Chart, {
  Editor as ChartEditor,
  generateCode as generateChartCode,
} from "./Chart";
import DataGrid, {
  Editor as DataGridEditor,
  generateCode as generateDataGridCode,
} from "./DataGrid";

export interface EditorProps<P> {
  value: P;
  onChange: (value: P) => void;
}

export interface DashboardComponent<P = {}> {
  Component: React.ComponentType<P>;
  Editor: React.ComponentType<EditorProps<P>>;
  initialProps: P;
  generateCode?: (name: string, props: P, ctx: GenerateContext) => string;
}

const components = new Map<string, DashboardComponent>([
  [
    "Chart",
    {
      Component: Chart,
      Editor: ChartEditor,
      initialProps: {},
      generateCode: generateChartCode,
    },
  ],
  [
    "DataGrid",
    {
      Component: DataGrid,
      Editor: DataGridEditor,
      initialProps: {},
      generateCode: generateDataGridCode,
    },
  ],
]);

export default components;
