import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  outputFileTracingIncludes: {
    "/api/[[...path]]": ["./server/data/store.json"],
  },
};

export default nextConfig;
