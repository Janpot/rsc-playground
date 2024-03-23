import { Box, Stack, SxProps, TextField } from "@mui/material";
import * as React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "../../resizablePanels";
import { useRunner } from "react-runner";
import { IMPORTS, ModuleContext, createModuleContext } from "../../codegen";
import { generateCode } from "./codegen";

interface DataSource {
  kind: "rest";
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: { name: string; value: string }[];
}

export interface DashboardChartProps {
  title?: string;
  data?: DataSource;
}

interface DataSourceEditorProps {
  sx?: SxProps;
  value: DataSource;
  onChange: (value: DataSource) => void;
}

function DataSourceEditor({ sx, value, onChange }: DataSourceEditorProps) {
  return (
    <Stack sx={sx} spacing={2}>
      <TextField
        label="URL"
        value={value.url}
        onChange={(event) => onChange({ ...value, url: event.target.value })}
      />
      <TextField
        label="Method"
        value={value.method}
        onChange={(event) =>
          onChange({ ...value, method: event.target.value as any })
        }
      />
    </Stack>
  );
}

const DEFAULT_DATASOURCE: DataSource = { kind: "rest" };

interface EditorProps {
  value: DashboardChartProps;
  onChange: (value: DashboardChartProps) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  const [input, setInput] = React.useState(value);
  React.useEffect(() => {
    setInput(value);
  }, [value]);
  const code = React.useMemo(() => {
    const ctx = createModuleContext();

    const chartCode = generateCode("DashboardChart", input, ctx);
    return `
    ${ctx.renderImports()}

    ${chartCode}
    
    export default DashboardChart;`;
  }, [input]);

  const scope = React.useMemo(() => ({ import: IMPORTS }), []);

  const { element } = useRunner({
    code,
    scope,
  });

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <PanelGroup direction="horizontal">
        <Panel>
          <Box sx={{ width: "100%", height: "100%", p: 2 }}>{element}</Box>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={25}>
          <TextField
            label="title"
            value={value.title}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
          />
        </Panel>
      </PanelGroup>
    </Box>
  );
}
