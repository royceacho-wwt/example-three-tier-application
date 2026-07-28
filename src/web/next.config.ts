import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  // Required for GitHub Pages deployment under a repository subpath
  basePath: isStaticExport ? process.env.NEXT_PUBLIC_BASE_PATH || "" : "",
  // Disable image optimization for static export (not supported)
  images: isStaticExport ? { unoptimized: true } : undefined,
};

export default nextConfig;
