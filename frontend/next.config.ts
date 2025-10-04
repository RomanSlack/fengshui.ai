import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.pravatar.cc'],
  },
  serverExternalPackages: [],
  
  // Disable Next.js development indicators completely
  devIndicators: {
    appIsrStatus: false,         // Disable ISR status indicator  
    buildActivity: false,        // Disable build activity indicator
  },
};

export default nextConfig;