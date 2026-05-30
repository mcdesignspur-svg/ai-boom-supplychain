/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The D3 engine owns the SVG imperatively; nothing here needs experimental flags.
  // Reference-data and live quotes are fetched server-side via /api/quotes.

  // TypeScript type-checking stays ON during build (catches real errors).
  // ESLint runs via `npm run lint` in CI rather than blocking the Vercel build
  // on style nits — keeps deploys from breaking over a lint warning.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
