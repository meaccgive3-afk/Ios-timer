import ActivityKit
import Foundation

/// يوصف بيانات النشاط الحيّ. هذا الملف يجب أن يُضاف إلى **كلا** الهدفين:
/// تطبيق Capacitor الرئيسي، وامتداد الويدجت (Widget Extension).
struct TimerActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// لحظة انتهاء المؤقت. نمرّر التاريخ لا الثواني المتبقية حتى يتولّى
        /// النظام العدّ التنازلي بنفسه بلا أي تحديثات دورية.
        var endAt: Date
        /// المدة الكلية بالثواني — تُستخدم لرسم شريط التقدّم.
        var totalSeconds: Double
        /// هل المؤقت متوقف مؤقتاً؟
        var isPaused: Bool
        /// الوقت المتبقي المجمّد عند الإيقاف المؤقت.
        var pausedRemaining: Double
    }

    /// عنوان ثابت للمؤقت يظهر في النشاط الحيّ.
    var label: String
}
