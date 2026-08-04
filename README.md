# المؤقت — تطبيق أندرويد (APK)

تطبيق مؤقت بعقارب انسيابية، مبني بـ Next.js ومغلّف كتطبيق أندرويد أصلي عبر Capacitor.
يعمل كموقع ويب وكتطبيق APK من نفس الكود.

## كيف أحصل على ملف APK؟

الطريقة الأسهل — من غيتهب مباشرة، بدون أي برامج على جهازك:

1. اذهب إلى تبويب **Actions** في المستودع على GitHub.
2. اختر **Build Android APK** من القائمة الجانبية.
3. البناء يشتغل تلقائيًا مع كل `push`. أو اضغط **Run workflow** لتشغيله يدويًا.
4. بعد انتهاء البناء (علامة صح خضراء)، افتح صفحة البناء وانزل لأسفل إلى **Artifacts**.
5. نزّل `timer-apk-debug` — بداخله ملف `app-debug.apk`.
6. انقل الملف لهاتفك، وفعّل **تثبيت من مصادر غير معروفة**، ثم ثبّته.

نسخة `debug` موقّعة بمفتاح تجريبي وتُثبّت وتعمل بشكل طبيعي على أي هاتف — مناسبة للاستخدام الشخصي والتجربة.

## نسخة release موقّعة (لمتجر Play)

إذا أردت نسخة release موقّعة بمفتاحك الخاص:

1. أنشئ مفتاح توقيع:

```bash
keytool -genkey -v -keystore release.keystore -alias timer -keyalg RSA -keysize 2048 -validity 10000
base64 -w 0 release.keystore > keystore.txt
```

2. في GitHub: **Settings → Secrets and variables → Actions → New repository secret**، وأضف:

| السر | القيمة |
| --- | --- |
| `KEYSTORE_BASE64` | محتوى `keystore.txt` |
| `KEYSTORE_PASSWORD` | كلمة مرور الـ keystore |
| `KEY_ALIAS` | `timer` |
| `KEY_PASSWORD` | كلمة مرور المفتاح |

3. شغّل الـ workflow يدويًا واختر `release` من قائمة **نوع البناء**.

## البناء محليًا (اختياري)

يتطلب Node 22، JDK 21، و Android SDK.

```bash
npm install
npm run apk:debug     # ينتج android/app/build/outputs/apk/debug/app-debug.apk
npm run apk:release   # نسخة release
```

## أوامر المشروع

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | تشغيل الموقع للتطوير |
| `npm run build` | بناء الموقع للنشر على Vercel |
| `npm run build:app` | تصدير ثابت في `out/` للتطبيق |
| `npm run sync:android` | تصدير + مزامنة مشروع أندرويد |
| `npm run apk:debug` | بناء APK للتجربة |
| `npm run apk:release` | بناء APK موقّع |

## بنية المشروع

- `app/`, `components/` — واجهة المؤقت (Next.js + React)
- `components/native-shell.tsx` — إعدادات شريط الحالة وشاشة البداية للتطبيق الأصلي
- `capacitor.config.ts` — إعدادات Capacitor (اسم التطبيق، الهوية، الألوان)
- `android/` — مشروع أندرويد الأصلي
- `.github/workflows/build-apk.yml` — بناء APK تلقائيًا على GitHub Actions

## ملاحظات تقنية

- `BUILD_TARGET=app` يحوّل Next.js إلى `output: "export"` لإنتاج ملفات ثابتة يقرأها WebView.
- كل مكونات المؤقت تعمل على العميل، لذا لا حاجة لأي سيرفر داخل التطبيق.
- التطبيق مثبّت على الوضع الرأسي مع ثيم أسود كامل لتجنّب أي وميض أبيض عند الإطلاق.
