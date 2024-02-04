import Chart, { Editor as ChartEditor } from "./Chart";
import DataGrid, { Editor as DataGridEditor } from "./DataGrid";

export interface EditorProps<P> {
  value: P;
  onChange: (value: P) => void;
}

export interface DashboardComponent<P = {}> {
  Component: React.ComponentType<P>;
  Editor: React.ComponentType<EditorProps<P>>;
  initialProps: P;
}

const components = new Map<string, DashboardComponent>([
  [
    "Chart",
    {
      Component: Chart,
      Editor: ChartEditor,
      initialProps: {},
    },
  ],
  [
    "DataGrid",
    {
      Component: DataGrid,
      Editor: DataGridEditor,
      initialProps: {},
    },
  ],
]);

export default components;
