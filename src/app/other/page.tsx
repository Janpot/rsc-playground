import invariant from "invariant";
import { Container } from "@mui/material";
import { createPgDataSource } from "@/lib/postgres";
import DataGrid from "@/lib/DataGrid";

invariant(process.env.DATABASE_URL, "Missing env var DATABASE_URL");

const data = createPgDataSource({
  connectionString: process.env.DATABASE_URL,
  list: `SELECT * FROM rna`,
});

export default async function Home() {
  return (
    <Container sx={{ pt: 5 }}>
      <DataGrid data={data} />
    </Container>
  );
}
