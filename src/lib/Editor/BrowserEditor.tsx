"use client";

import "@mdxeditor/editor/style.css";
import { Button, Box } from "@mui/material";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import MDXEditor from "./MDXEditor";

const ROOT_CLASS_NAME = "MDX_root";
const CONTENT_EDITABLE_CLASS_NAME = "MDX_content-editable";

interface BrowserEditor {
  value: string;
  writeToFile: (newValue: string) => Promise<void>;
}

export default function BrowserEditor({ value, writeToFile }: BrowserEditor) {
  const [input, setInput] = React.useState(value);
  React.useEffect(() => {
    setInput(value);
  }, [value]);

  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box
      sx={{
        position: "relative",
        [`.${ROOT_CLASS_NAME}`]: {
          "--font-body": "inherit",
        },

        [`.${CONTENT_EDITABLE_CLASS_NAME}`]: {
          padding: 0,
        },
      }}
    >
      <MDXEditor
        className={ROOT_CLASS_NAME}
        contentEditableClassName={CONTENT_EDITABLE_CLASS_NAME}
        markdown={input}
        onChange={setInput}
      />
      <Button
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          marginTop: 2,
          marginRight: 2,
        }}
        onClick={async () => {
          await writeToFile(input);

          router.replace(pathname);
        }}
      >
        Save
      </Button>
    </Box>
  );
}
