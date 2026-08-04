import { SmoothTimer } from "@/components/smooth-timer"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      <header className="flex w-full max-w-md items-center justify-between px-6 pt-6 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">المؤقت</h1>
        <span className="text-xs text-muted">عقارب تدور بسلاسة</span>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-5 py-4">
        <SmoothTimer />
      </main>
    </div>
  )
}
