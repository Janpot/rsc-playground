import { Container } from "@mui/material";
import * as path from "path";
import * as url from "url";
import { Dashboard } from "../../lib/Dashboard";

export const dynamic = "force-dynamic";

const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
const FILE = path.resolve(currentDir, "./myDashboard.json");

export default function Home(props: { searchParams: any }) {
  const isEditor = props.searchParams.edit !== undefined;
  return (
    <Container sx={{ pt: 5 }}>
      <div>
        <Dashboard file={FILE} editable />
      </div>
    </Container>
  );
}
