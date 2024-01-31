import * as fs from "fs/promises";
import BrowserEditor from "./BrowserEditor";

interface EditorProps {
  file: string;
}

export default async function Editor({ file }: EditorProps) {
  const content = await fs.readFile(file, "utf-8");

  async function writeToFile(newValue: string) {
    "use server";

    await fs.writeFile(file, newValue);
  }

  return <BrowserEditor value={content} writeToFile={writeToFile} />;
}
