import { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import * as React from "react";

const Editor = dynamic(() => import("./InitializedMDXEditor"), {
  // Make sure we turn SSR off
  ssr: false,
});

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export default React.forwardRef<MDXEditorMethods, MDXEditorProps>(
  function ForwardRefEditor(props, ref) {
    return <Editor {...props} editorRef={ref} />;
  },
);
