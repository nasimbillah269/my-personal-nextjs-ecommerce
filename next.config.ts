import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating "N" dev-tools button shown during `npm run dev`.
  devIndicators: false,
  experimental: {
    serverActions: {
      // Product images (max 3 MB) are uploaded through a server action.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
