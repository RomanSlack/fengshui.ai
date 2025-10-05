import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.pravatar.cc', 'lh3.googleusercontent.com'],
  },
  serverExternalPackages: [],
};

export default nextConfig;