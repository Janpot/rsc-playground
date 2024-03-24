import * as React from "react";
import { Box } from "@mui/material";
import { DashboardConfig } from "./schema";

export interface DataEditorProps {
  value: DashboardConfig;
  onChange: (value: DashboardConfig) => void;
}

export default function DataEditor(props: DataEditorProps) {
  return <Box />;
}
