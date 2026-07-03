/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};
module.exports = nextConfig;
