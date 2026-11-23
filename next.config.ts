import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Foto dikompresi di browser sebelum dikirim, jadi 3 MB sudah longgar.
    serverActions: { bodySizeLimit: "3mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
