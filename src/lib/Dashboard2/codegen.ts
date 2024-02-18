import invariant from "invariant";
import { Paper, Typography } from "@mui/material";
import "react-grid-layout/css/styles.css";
import Grid from "@mui/material/Unstable_Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import * as xCharts from "@mui/x-charts";
import * as xDataGridPro from "@mui/x-data-grid-pro";

export const IMPORTS: Record<string, unknown> = {
  "@mui/material/Unstable_Grid2": Grid,
  "@mui/material/Box": Box,
  "@mui/material/Stack": Stack,
  "@mui/material/Paper": Paper,
  "@mui/material/Typography": Typography,
  "@mui/x-charts": xCharts,
  "@mui/x-data-grid-pro": xDataGridPro,
};

export interface ModuleContext {
  renderImports: () => string;
  requireImport: (specifier: string, names: Record<string, string>) => void;
}

export function createModuleContext(): ModuleContext {
  const imports = new Map<string, Record<string, string>>();
  let sealed = false;

  const requireImport = (specifier: string, names: Record<string, string>) => {
    invariant(!sealed, "Module context is sealed");
    invariant(IMPORTS[specifier], `Unknown import specifier: ${specifier}`);
    let existingNames = imports.get(specifier);
    if (!existingNames) {
      existingNames = {};
      imports.set(specifier, existingNames);
    }
    for (const [name, specifier] of Object.entries(names)) {
      existingNames[name] = specifier;
    }
  };

  const renderImports = () => {
    sealed = true;
    return Array.from(
      imports.entries(),
      ([specifier, names]) =>
        `import {${Object.entries(names)
          .map(([name, specifier]) => `${name} as ${specifier}`)
          .join(", ")}} from "${specifier}";`,
    ).join("\n");
  };

  return {
    renderImports,
    requireImport,
  };
}
