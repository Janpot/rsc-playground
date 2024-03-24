import * as React from "react";
import { Box } from "@mui/material";
import { DashboardConfig } from "./schema";
import { PanelResizeHandle, Panel, PanelGroup } from "./resizablePanels";
import { DataGridPro } from "@mui/x-data-grid-pro";

export interface DataEditorProps {
  value: DashboardConfig;
  onChange: (value: DashboardConfig) => void;
}

export default function DataEditor(props: DataEditorProps) {
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <PanelGroup direction="horizontal">
        <Panel>editor</Panel>
        <PanelResizeHandle />
        <Panel>
          <DataGridPro autoPageSize rows={[]} columns={[]} />
        </Panel>
      </PanelGroup>
    </Box>
  );
}
