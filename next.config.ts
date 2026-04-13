import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Docker için eklediğimiz ayar
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fwxsyfqppozrvmaorjoo.supabase.co", // Supabase URL'in
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;