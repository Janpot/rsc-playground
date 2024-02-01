import { Box, Container } from "@mui/material";
import Content from "./page.mdx";
import * as path from "path";
import * as url from "url";
import { Dashboard } from "../../lib/Dashboard";

export const dynamic = "force-dynamic";

const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
const FILE = path.resolve(currentDir, "./myDashboard.json");

export default function Home(props) {
  const isEditor = props.searchParams.edit !== undefined;
  return (
    <Container sx={{ pt: 5 }}>
      <Dashboard file={FILE} editable />
    </Container>
  );
}
