import invariant from "invariant";
import { createConnection } from "./lib/postgres";

invariant(process.env.DATABASE_URL, "DATABASE_URL is required");
export const rnaCentral = createConnection(process.env.DATABASE_URL);
