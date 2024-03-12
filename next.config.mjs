import nextMdx from "@next/mdx";
import url from "url";
import path from "path";
import remarkPlugin from "./src/lib/remarkPlugin.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // mdxRs: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

const currentFile = url.fileURLToPath(new URL(".", import.meta.url));

const withMDX = nextMdx({
  options: {
    remarkPlugins: [
      [
        remarkPlugin,
        { connectionsFile: path.resolve(currentFile, "./src/connections") },
      ],
    ],
  },
});

export default withMDX(nextConfig);
