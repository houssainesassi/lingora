import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Almost every route in Lingora is personalised (Supabase session cookies),
  // so we use the classic dynamic rendering model instead of Cache Components.
  // `partialPrefetching` requires `cacheComponents`, so it is omitted too.
  cacheComponents: false,
  poweredByHeader: false,
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
