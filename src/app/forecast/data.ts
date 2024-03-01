"use server";

import { createConnection } from "../../lib/dash";

const db = createConnection(process.env.DATABASE_URL!);

export const dataQuery1 = db.query((filter) => "SELECT * FROM rna LIMIT 10");

export const dataQuery2 = db.query(
  (filter) => "SELECT * FROM rfam_analyzed_sequences LIMIT 10",
);

export const dataQuery3 = db.query(
  (filter) =>
    "SELECT userstamp, count(*) from (SELECT * FROM xref LIMIT 100000)as dhj GROUP BY userstamp LIMIT 100",
);
