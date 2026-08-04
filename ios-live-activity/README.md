# الجزيرة الديناميكية (iOS Live Activity)

هذه الملفات جاهزة، لكن iOS **لا يمكن بناؤه إلا على جهاز ماك عبر Xcode** — لا يوجد
بديل، فهذا قيد من آبل. الخطوات مرة واحدة فقط:

## 1) إنشاء مشروع iOS

```bash
npm i @capacitor/ios
npm run build:app
npx cap add ios
```

## 2) نسخ ملف الإضافة

انسخ `LiveTimerPlugin.swift` و `TimerActivityAttributes.swift` إلى:

```
ios/App/App/
```

ثم في Xcode: اسحبهما داخل مجموعة `App` وتأكد أن `Target Membership` = **App**.

## 3) إضافة امتداد الويدجت

في Xcode: `File → New → Target… → Widget Extension`

- الاسم: `TimerWidget`
- أزل علامة **Include Configuration App Intent**
- ضع علامة **Include Live Activity**

ثم:

- احذف الملفات التي أنشأها Xcode تلقائياً داخل `TimerWidget` (ما عدا `Info.plist`
  و `Assets`).
- انسخ إلى مجلد `TimerWidget`:
  - `TimerLiveActivity.swift`
  - `TimerWidgetBundle.swift`
  - `TimerActivityAttributes.swift` ← **مهم:** هذا الملف يجب أن يكون عضواً في
    **كلا** الهدفين (App و TimerWidget). حدّده في Xcode ثم من الشريط الأيمن
    `Target Membership` ضع علامة على الاثنين.

## 4) تفعيل الأنشطة الحيّة

في `ios/App/App/Info.plist` أضف:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>NSSupportsLiveActivitiesFrequentUpdates</key>
<true/>
```

وأضف نفس المفتاح `NSSupportsLiveActivities` في `Info.plist` الخاص بـ
`TimerWidget`.

## 5) البناء

```bash
npx cap sync ios
npx cap open ios
```

اضغط ▶ في Xcode على جهاز حقيقي (الجزيرة الديناميكية غير متاحة في المحاكي بشكل
كامل).

## ملاحظات

- الجزيرة الديناميكية تعمل على iPhone 14 Pro وما بعده. على الأجهزة الأقدم يظهر
  المؤقت في **شاشة القفل** وبطاقة النشاط الحيّ — وهو نفس السلوك تلقائياً.
- العدّ التنازلي يستخدم `Text(timerInterval:)` فيتحدّث بواسطة النظام كل ثانية
  دون أي تحديث برمجي — لا يستهلك بطارية ولا يحتاج خدمة خلفية.
- إشعار الانتهاء مجدول عبر `UNTimeIntervalNotificationTrigger` فيصل حتى لو
  أُغلق التطبيق تماماً.
