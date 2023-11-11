import { createConnection } from "./lib/postgres";

export const rnaCentral = createConnection(
  "postgres://reader:NWDMCE5xdipIjRrp@hh-pgsql-public.ebi.ac.uk:5432/pfmegrnargs"
);
