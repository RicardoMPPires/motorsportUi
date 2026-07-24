import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server is reached from other PCs by LAN IP; Next 16 blocks cross-origin
  // dev resources (HMR socket, stack frames) by default. Allow the local subnet.
  // ponytail: /24 wildcard survives DHCP; widen/change the prefix if your LAN differs.
  allowedDevOrigins: ["192.168.10.*", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
