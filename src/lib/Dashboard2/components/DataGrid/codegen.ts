import { ModuleContext } from "../../codegen";

export function generateCode(
  name: string,
  props: {},
  ctx: ModuleContext,
): string {
  ctx.requireImport("@mui/material/Box", { default: "Box" });
  ctx.requireImport("@mui/x-data-grid-pro", {
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
