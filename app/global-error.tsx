"use client"

import { useEffect, useState } from "react"

/**
 * الشاشة التي تحلّ محل صفحة Next الافتراضية «This page couldn't load».
 *
 * كانت المشكلة أنّ أي خطأ في الجذر داخل WebView يعرض تلك الصفحة الإنجليزية
 * المبهمة بزرّي Reload / Back فقط، بدون أي معلومة عن السبب. هنا نعرض نص الخطأ
 * الحقيقي لتشخيصه، مع زر استئناف لا يحتاج إعادة تشغيل التطبيق.
 *
 * global-error يجب أن يرسم <html> و <body> بنفسه لأنه يستبدل التخطيط الجذري.
 */
/**
 * عدّاد على مستوى الوحدة (لا يُصفَّر مع إعادة الرسم): يسمح بمحاولة استئناف
 * تلقائية واحدة فقط، فلا ندخل في حلقة لا نهائية إن كان الخطأ حقيقياً.
 */
let autoRetried = false

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [details, setDetails] = useState(false)
  const [recovering, setRecovering] = useState(!autoRetried)

  useEffect(() => {
    console.log("[v0] global error:", error?.name, error?.message, error?.digest)
    console.log("[v0] global error stack:", error?.stack)
  }, [error])

  // استئناف تلقائي مرّة واحدة.
  // سبب المشكلة: Capacitor يحقن وسم <script> داخل <head> قبل تشغيل التطبيق،
  // فيختلف DOM الصفحة عن HTML المُصدَّر ويفشل hydration فيرفع React خطأً
  // في الجذر => تظهر صفحة Next الافتراضية «This page couldn't load».
  // إعادة الرسم من العميل تنجح دائماً لأنها لا تقارن مع HTML السيرفر.
  useEffect(() => {
    if (autoRetried) return
    autoRetried = true
    const id = setTimeout(() => {
      setRecovering(false)
      reset()
    }, 60)
    return () => clearTimeout(id)
  }, [reset])

  if (recovering) {
    return (
      <html lang="ar" dir="rtl">
        <body style={{ margin: 0, minHeight: "100vh", background: "#000" }} />
      </html>
    )
  }

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          background: "#000",
          color: "#f2f2f7",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, color: "#ff3b30" }}>تعذّر تشغيل المؤقت</h1>
        <p style={{ margin: 0, maxWidth: 320, fontSize: 14, lineHeight: 1.7, color: "#8e8e93" }}>
          حدث خطأ أثناء بدء التطبيق. اضغط «إعادة المحاولة» أولاً، وإن تكرّر الخطأ افتح
          «تفاصيل» وأرسل النص لنعرف السبب.
        </p>

        <button
          type="button"
          onClick={reset}
          style={{
            border: 0,
            borderRadius: 999,
            background: "#ff3b30",
            color: "#fff",
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          إعادة المحاولة
        </button>

        <button
          type="button"
          onClick={() => setDetails((v) => !v)}
          style={{
            border: "1px solid #3a3a3c",
            borderRadius: 999,
            background: "transparent",
            color: "#8e8e93",
            padding: "8px 18px",
            fontSize: 13,
          }}
        >
          {details ? "إخفاء التفاصيل" : "تفاصيل الخطأ"}
        </button>

        {details ? (
          <pre
            dir="ltr"
            style={{
              maxWidth: "100%",
              maxHeight: 260,
              overflow: "auto",
              margin: 0,
              padding: 12,
              borderRadius: 14,
              background: "#1c1c1e",
              color: "#8e8e93",
              fontSize: 11,
              lineHeight: 1.6,
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {[
              `name: ${error?.name ?? "-"}`,
              `message: ${error?.message ?? "-"}`,
              `digest: ${error?.digest ?? "-"}`,
              "",
              error?.stack ?? "no stack",
            ].join("\n")}
          </pre>
        ) : null}
      </body>
    </html>
  )
}
