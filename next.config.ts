import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/[[...path]]": ["./server/data/store.json"],
  },
};

export default nextConfig;
