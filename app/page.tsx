import { SmoothTimer } from "@/components/smooth-timer"

export default function Home() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background px-6 py-10 font-sans">
      <h1 className="sr-only">مؤقت بعقارب انسيابية</h1>
      <SmoothTimer />
    </main>
  )
}
