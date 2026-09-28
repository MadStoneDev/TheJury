import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Retired gaming-era /for pages → their nearest Australian-org home.
    // Permanent (301): these old URLs are live and indexed. Keep in sync with
    // LEGACY_FOR_REDIRECTS in lib/marketing/audiences.ts.
    return [
      {
        source: "/for/gaming-groups",
        destination: "/for/clubs-and-associations",
        permanent: true,
      },
      {
        source: "/for/teams",
        destination: "/for/businesses",
        permanent: true,
      },
      {
        source: "/for/creators",
        destination: "/for/presenters",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Verified-voting links carry a member token in the query string
    // (/answer/CODE?t=...). no-referrer stops that token leaking to any
    // third party via the Referer header when the voting page loads external
    // resources or the voter follows an outbound link.
    return [
      {
        source: "/answer/:pollCode*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
