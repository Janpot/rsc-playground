import { Pool } from "pg";
import { DataSource, ServerGridColDef } from "./types";

const clients = new Map<string, Pool>();

const getPool = async (connectionString: string) => {
  "use server";
  let client = clients.get(connectionString);
  if (!client) {
    client = new Pool({ connectionString });
    clients.set(connectionString, client);
  }
  return client;
};

export function createConnection(connectionString: string) {
  return {
    createDataSource(query: string): DataSource<{}> {
      return {
        columns: [],
        getRows: async function list() {
          "use server";
          const pool = await getPool(connectionString);

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
    },
  };
}
