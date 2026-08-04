"use client"

import { useEffect } from "react"

/**
 * حدّ خطأ للصفحة: أي خطأ في المؤقت يظهر هنا مع إمكانية الاستئناف،
 * بدل صفحة «This page couldn't load» التي تُلغي التطبيق بالكامل.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log("[v0] page error:", error?.message, error?.stack)
  }, [error])

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-5 bg-background px-6 text-center font-sans"
    >
      <h2 className="text-xl font-semibold text-alert">تعذّر عرض المؤقت</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        حدث خطأ غير متوقع. اضغط «إعادة المحاولة» للمتابعة بدون إعادة تشغيل التطبيق.
      </p>
      <pre
        dir="ltr"
        className="max-h-40 w-full max-w-sm overflow-auto rounded-2xl bg-surface p-3 text-left font-mono text-[11px] leading-relaxed text-muted"
      >
        {error?.message || "unknown error"}
      </pre>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-alert px-6 py-3 text-sm font-semibold text-foreground transition-transform active:scale-95"
      >
        إعادة المحاولة
      </button>
    </div>
  )
}
