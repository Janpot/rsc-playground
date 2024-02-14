"use client";

import * as React from "react";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { GenerateContext } from "../../ClientDashboard";

export default function DashboardDataGrid() {
  return <DataGridPro rows={[]} columns={[]} />;
}

export function generateCode(
  name: string,
  props: {},
  ctx: GenerateContext,
): string {
  ctx.useImport("@mui/material/Box", { default: "Box" });
  ctx.useImport("@mui/x-data-grid-pro", {
    DataGridPro: "DataGridPro",
  });
  return `
  function ${name} () {
    return (
      <Box sx={{ width: '100%', minHeight: 300, height: '100%' }}>
        <DataGridPro rows={[]} columns={[]} />
      </Box>
    );
  }
`;
}

export function Editor() {
  return <div>TODO: implement DataGrid Editor</div>;
}
