/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
