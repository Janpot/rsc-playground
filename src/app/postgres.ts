import { Pool } from "pg";
import { Collection, ServerGridColDef } from "./types";
import { GridColDef } from "@mui/x-data-grid-pro";

const pool = new Pool({
  connectionString:
    "postgresql://jsnvylcwjkkwladwpfeweisn%40psql-mock-database-cloud:ucoatezgpbqtotwpusdojnce@psql-mock-database-cloud.postgres.database.azure.com:5432/websites1683312847864wsbmmynyneodpfde",
});

export function sqlDataSource(query: string): Collection<{}> {
  return {
    columns: [],
    list: async function list() {
      "use server";

      const { rows, fields } = await pool.query(query);

      const columns = new Map<string, ServerGridColDef<{}>>();

      for (const pgField of fields) {
        const field = pgField.tableID + "." + pgField.name;
        if (!columns.has(field)) {
          columns.set(field, {
            field,
            headerName: pgField.name,
            valueProp: pgField.name,
          });
        }
      }

      return {
        rows: rows.map((row, _index) => ({ ...row, _index })),
        columns: Array.from(columns.values()),
        rowIdField: "_index",
        paginationMode: "client",
        sortingMode: "client",
      };
    },
  };
}
