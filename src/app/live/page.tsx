import { Box } from "@mui/material";
import * as path from "path";
import * as url from "url";
import { Dashboard } from "../../lib/Dashboard2";

export const dynamic = "force-dynamic";

const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
const FILE = path.resolve(currentDir, "./myDashboard.json");

export default function Home(props: { searchParams: any }) {
  const isEditor = props.searchParams.edit !== undefined;
  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <div>
        <Dashboard file={FILE} editable />
      </div>
    </Box>
  );
}
