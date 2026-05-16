import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "heic-convert"],
  experimental: {
    // Photo uploads run through Server Actions; raise the default 1 MB limit.
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default withNextIntl(nextConfig);
