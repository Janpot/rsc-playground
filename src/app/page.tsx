import DataGrid from "../lib/DataGrid";
import { Container } from "@mui/material";
import HelloWorld from "./page.mdx";

export default function Home() {
  return (
    <Container sx={{ pt: 5 }}>
      <div>
        <HelloWorld components={{ DataGrid }} />
      </div>
    </Container>
  );
}
