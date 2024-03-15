import "server-only";

import { Datum, FieldDef, GetManyMethod, GetManyParams } from "./client";
import { Pool } from "pg";

interface SqlFunction<R extends Datum> {
  (params: GetManyParams<R>): string;
}

export function createConnection<R extends Datum>(connectionString: string) {
  const pool = new Pool({ connectionString });
  return {
    query(sql: SqlFunction<R>): GetManyMethod<R> {
      return async (params) => {
        const { rows, fields } = await pool.query(sql(params));

        const columns = new Map<string, FieldDef<any>>();

        for (const pgField of fields) {
          const field = pgField.tableID + "." + pgField.name;
          if (!columns.has(field)) {
            columns.set(field, {
              type: "string",
              label: pgField.name,
            });
          }
        }

        return {
          rows: rows.map((row, _index) => ({ ...row, _index })),
          fields: Array.from(columns.values()),
        };
      };
    },
  };
}
