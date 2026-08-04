import ActivityKit
import Capacitor
import Foundation
import UserNotifications

/// إضافة Capacitor لنظام iOS — تعرض المؤقت في الجزيرة الديناميكية وشاشة القفل
/// عبر ActivityKit، وتجدول إشعاراً محلياً عند الانتهاء (يعمل والتطبيق مغلق).
///
/// ضع هذا الملف في مجلد `ios/App/App/` بعد تشغيل `npx cap add ios`.
@objc(LiveTimerPlugin)
public class LiveTimerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveTimerPlugin"
    public let jsName = "LiveTimer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
    ]

    private static let notificationID = "timer.finished"

    @available(iOS 16.2, *)
    private var activity: Activity<TimerActivityAttributes>? {
        Activity<TimerActivityAttributes>.activities.first
    }

    // MARK: - التشغيل

    @objc func start(_ call: CAPPluginCall) {
        let endAtMs = call.getDouble("endAt") ?? Date().timeIntervalSince1970 * 1000
        let totalMs = call.getDouble("totalMs") ?? 0
        let label = call.getString("label") ?? "المؤقت"
        let endAt = Date(timeIntervalSince1970: endAtMs / 1000)

        scheduleFinishNotification(at: endAt, label: label)

        guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve()
            return
        }

        endAllActivities()

        let state = TimerActivityAttributes.ContentState(
            endAt: endAt,
            totalSeconds: totalMs / 1000,
            isPaused: false,
            pausedRemaining: 0
        )

        do {
            _ = try Activity.request(
                attributes: TimerActivityAttributes(label: label),
                content: ActivityContent(state: state, staleDate: endAt.addingTimeInterval(60)),
                pushType: nil
            )
            call.resolve()
        } catch {
            call.reject("تعذّر بدء النشاط الحيّ: \(error.localizedDescription)")
        }
    }

    // MARK: - إيقاف مؤقت / متابعة

    @objc func pause(_ call: CAPPluginCall) {
        cancelFinishNotification()

        guard #available(iOS 16.2, *), let activity = activity else {
            call.resolve()
            return
        }

        let previous = activity.content.state
        let remaining = max(0, previous.endAt.timeIntervalSinceNow)
        let state = TimerActivityAttributes.ContentState(
            endAt: previous.endAt,
            totalSeconds: previous.totalSeconds,
            isPaused: true,
            pausedRemaining: remaining
        )

        Task {
            await activity.update(ActivityContent(state: state, staleDate: nil))
            call.resolve()
        }
    }

    @objc func resume(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *), let activity = activity else {
            call.resolve()
            return
        }

        let previous = activity.content.state
        let endAt = Date().addingTimeInterval(previous.pausedRemaining)
        scheduleFinishNotification(at: endAt, label: activity.attributes.label)

        let state = TimerActivityAttributes.ContentState(
            endAt: endAt,
            totalSeconds: previous.totalSeconds,
            isPaused: false,
            pausedRemaining: 0
        )

        Task {
            await activity.update(ActivityContent(state: state, staleDate: endAt.addingTimeInterval(60)))
            call.resolve()
        }
    }

    // MARK: - إلغاء

    @objc func stop(_ call: CAPPluginCall) {
        cancelFinishNotification()
        if #available(iOS 16.2, *) { endAllActivities() }
        call.resolve()
    }

    @available(iOS 16.2, *)
    private func endAllActivities() {
        Task {
            for activity in Activity<TimerActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
    }

    // MARK: - الدعم والصلاحيات

    @objc func isSupported(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            call.resolve(["supported": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["supported": false])
        }
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let status: String
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral: status = "granted"
            case .denied: status = "denied"
            default: status = "prompt"
            }
            call.resolve(["notifications": status])
        }
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge]
        ) { granted, _ in
            call.resolve(["notifications": granted ? "granted" : "denied"])
        }
    }

    // MARK: - إشعار الانتهاء

    private func scheduleFinishNotification(at date: Date, label: String) {
        cancelFinishNotification()

        let interval = date.timeIntervalSinceNow
        guard interval > 0 else { return }

        let content = UNMutableNotificationContent()
        content.title = "انتهى الوقت"
        content.body = label
        content.sound = .defaultCritical
        content.interruptionLevel = .timeSensitive

        let request = UNNotificationRequest(
            identifier: Self.notificationID,
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func cancelFinishNotification() {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: [Self.notificationID])
    }
}
