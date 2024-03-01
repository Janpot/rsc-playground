import "server-only";

import { SerializableGridColDef, FetchData, FetchDataParams } from "./client";
import { Pool } from "pg";

interface SqlFunction {
  (params: FetchDataParams): string;
}

export function createConnection(connectionString: string) {
  const pool = new Pool({ connectionString });
  return {
    query(sql: SqlFunction): FetchData {
      return async (params) => {
        const { rows, fields } = await pool.query(sql(params));

        const columns = new Map<string, SerializableGridColDef>();

        for (const pgField of fields) {
          const field = pgField.tableID + "." + pgField.name;
          if (!columns.has(field)) {
            columns.set(field, {
              type: "string",
              field,
              headerName: pgField.name,
              valuePath: [pgField.name],
            });
          }
        }

        return {
          rows: rows.map((row, _index) => ({ ...row, _index })),
          columns: Array.from(columns.values()),
        };
      };
    },
  };
}
