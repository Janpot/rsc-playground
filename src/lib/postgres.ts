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

// FOR DEMO PURPOSES ONLY, THIS CONTAINS SQL INJECTION

export function createPgDataSource({
  connectionString,
  list: listQuery,
}: {
  connectionString: string;
  list: string;
}): DataSource<{}> {
  return {
    paginationMode: "pages",
    columns: [],
    getRows: async function list({ paginationModel, sortModel }) {
      "use server";

      console.log(listQuery, paginationModel);
      const pool = getConnection(connectionString);

      const offset = paginationModel.start;
      const limit = paginationModel.pageSize;
      const order =
        sortModel.length > 0
          ? `ORDER BY ${sortModel.map((part) => `"${part.field}" ${part.sort}`).join(", ")}`
          : "";

      console.log(listQuery, offset, limit);
      const { rows, fields } = await pool.query(
        `SELECT * FROM (${listQuery}) as user_Query OFFSET ${offset} LIMIT ${limit}`,
      );

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
        hasNextPage: rows.length >= paginationModel.pageSize,
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
