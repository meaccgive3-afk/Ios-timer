import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = IBM_Plex_Sans_Arabic({
  variable: "--font-geist-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "المؤقت — عقارب تدور بسلاسة",
  description: "مؤقت بعقارب تحليلية تدور بسلاسة بتصميم مستوحى من iOS. حدد المدة وابدأ العد التنازلي.",
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-background antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  )
}
