import { createConnection } from "./lib/postgres";

export const rnaCentral = createConnection(process.env.DATABASE_URL);
