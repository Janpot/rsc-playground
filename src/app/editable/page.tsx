import { Container } from "@mui/material";
import Content from "./page.mdx";
import * as path from "path";
import * as url from "url";
import MdxEditor from "../../lib/Editor";
import type {} from "next/app";

export const dynamic = "force-dynamic";

const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
const FILE = path.resolve(currentDir, "./page.mdx");

export default function Home(props: any) {
  const isEditor = props.searchParams.edit !== undefined;
  return (
    <Container sx={{ pt: 5 }}>
      <a href="?edit">Edit</a>
      <div>{isEditor ? <MdxEditor file={FILE} /> : <Content />}</div>
    </Container>
  );
}
