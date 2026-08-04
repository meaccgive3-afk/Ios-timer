import type { NextConfig } from "next"

// عند البناء للتطبيق (APK) نحتاج تصديرًا ثابتًا بدون سيرفر
const isAppBuild = process.env.BUILD_TARGET === "app"

const nextConfig: NextConfig = isAppBuild
  ? {
      output: "export",
      // بدون distDir مخصص: التصدير الثابت يذهب إلى out/ وهو ما يقرأه Capacitor
      images: { unoptimized: true },
      // مهم لـ WebView: مع trailingSlash يطلب موجّه Next حِزم RSC من مسارات
      // بشرطة مائلة زائدة لا يعرفها سيرفر Capacitor المحلي فتفشل بـ 404،
      // وإطفاء إعادة التوجيه يمنع الموجّه من محاولة تصحيح المسار من الأساس.
      trailingSlash: false,
      skipTrailingSlashRedirect: true,
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
