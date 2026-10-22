import type { NextConfig } from "next";

const securityHeaders = [
  // Nobody can show the store or admin panel inside an <iframe> on another site (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  // Browsers must trust the Content-Type we send instead of guessing it.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Only sent in production: tells browsers to always use HTTPS for this domain.
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // Hide the floating "N" dev-tools button shown during `npm run dev`.
  devIndicators: false,
  // Don't advertise the framework in an "X-Powered-By" header.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Product images (max 3 MB) are uploaded through a server action.
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
