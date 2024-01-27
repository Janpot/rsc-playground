import { Pool } from "pg";
import { DataSource, ServerGridColDef } from "./types";

function getConnection(connectionString: string): Pool {
  global._connections ??= new Map<string, Pool>();
  let pool = global._connections.get(connectionString);
  if (!pool) {
    pool = new Pool({ connectionString });
    global._connections.set(connectionString, pool);
  }
  return pool;
}

export function createPgDataSource({
  connectionString,
  list: listQuery,
}: {
  connectionString: string;
  list: string;
}): DataSource<{}> {
  return {
    columns: [],
    getRows: async function list() {
      "use server";
      const pool = getConnection(connectionString);

      const { rows, fields } = await pool.query(listQuery);

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

export function createConnection(connectionString: string) {
  return {
    createDataSource(query: string): DataSource<{}> {
      return createPgDataSource({ connectionString, list: query });
    },
  };
}
