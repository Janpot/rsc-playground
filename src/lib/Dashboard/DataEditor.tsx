import * as React from "react";
import { Box, Button, MenuItem, TextField, Toolbar } from "@mui/material";
import { DashboardConfig } from "./schema";
import { PanelResizeHandle, Panel, PanelGroup } from "./resizablePanels";
import { DataGridPro } from "@mui/x-data-grid-pro";

export interface DataEditorProps {
  onClose: () => void;
  value: DashboardConfig;
  onChange: (value: DashboardConfig) => void;
}

export default function DataEditor({ value, onClose }: DataEditorProps) {
  const availableProviders = React.useMemo(() => {
    return Object.entries(value.data).map(([key, { name }]) => ({ key, name }));
  }, [value.data]);
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toolbar variant="dense">
        <TextField select label="Data Provider">
          {availableProviders.map((provider) => (
            <MenuItem key={provider.key} value={provider.key}>
              {provider.name}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />

        <Button onClick={onClose}>Apply</Button>
        <Button onClick={onClose}>Discard</Button>
      </Toolbar>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <PanelGroup direction="horizontal">
          <Panel>editor</Panel>
          <PanelResizeHandle />
          <Panel>
            <DataGridPro autoPageSize rows={[]} columns={[]} />
          </Panel>
        </PanelGroup>
      </Box>
    </Box>
  );
}
