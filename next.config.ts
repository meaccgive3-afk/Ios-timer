import type { NextConfig } from "next"

// عند البناء للتطبيق (APK) نحتاج تصديرًا ثابتًا بدون سيرفر
const isAppBuild = process.env.BUILD_TARGET === "app"

const nextConfig: NextConfig = isAppBuild
  ? {
      output: "export",
      distDir: ".next-app",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      async headers() {
        return [
          {
            source: "/(.*)",
            headers: [
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              { key: "Strict-Transport-Security", value: "max-age=63072000" },
              { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            ],
          },
        ]
      },
    }

export default nextConfig
