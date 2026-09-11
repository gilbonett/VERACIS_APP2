import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["react-map-gl", "mapbox-gl"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/map",
        permanent: false,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.veracis-app.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
