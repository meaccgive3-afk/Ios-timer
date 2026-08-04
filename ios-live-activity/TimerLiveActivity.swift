import ActivityKit
import SwiftUI
import WidgetKit

/// واجهة النشاط الحيّ: الجزيرة الديناميكية (مطوية وموسّعة) + بطاقة شاشة القفل.
/// يُضاف هذا الملف إلى هدف امتداد الويدجت فقط (Widget Extension).
@available(iOS 16.2, *)
struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.85))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // الحالة الموسّعة — عند اللمس المطوّل على الجزيرة
                DynamicIslandExpandedRegion(.leading) {
                    Label {
                        Text(context.attributes.label)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } icon: {
                        Image(systemName: "timer")
                            .foregroundStyle(Color(red: 1, green: 0.62, blue: 0.04))
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    CountdownText(state: context.state)
                        .font(.system(.title2, design: .rounded).weight(.semibold))
                        .monospacedDigit()
                        .foregroundStyle(.white)
                        .frame(minWidth: 84, alignment: .trailing)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    ProgressBar(state: context.state)
                }
            } compactLeading: {
                Image(systemName: "timer")
                    .foregroundStyle(Color(red: 1, green: 0.62, blue: 0.04))
            } compactTrailing: {
                // الحالة المطوية — ما يظهر دائماً في الجزيرة الديناميكية
                CountdownText(state: context.state)
                    .font(.system(.caption, design: .rounded).weight(.semibold))
                    .monospacedDigit()
                    .foregroundStyle(Color(red: 1, green: 0.62, blue: 0.04))
                    .frame(minWidth: 44)
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(Color(red: 1, green: 0.62, blue: 0.04))
            }
            .keylineTint(Color(red: 1, green: 0.62, blue: 0.04))
        }
    }
}

/// نصّ العدّ التنازلي. عند العمل نستخدم `Text(timerInterval:)` فيتولّى النظام
/// تحديثه كل ثانية بلا أي كود — وعند الإيقاف نعرض قيمة ثابتة.
@available(iOS 16.2, *)
private struct CountdownText: View {
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        if state.isPaused {
            Text(format(state.pausedRemaining))
        } else {
            Text(timerInterval: Date()...max(state.endAt, Date().addingTimeInterval(1)),
                 countsDown: true)
        }
    }

    private func format(_ seconds: Double) -> String {
        let total = Int(max(0, seconds))
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return h > 0
            ? String(format: "%d:%02d:%02d", h, m, s)
            : String(format: "%d:%02d", m, s)
    }
}

@available(iOS 16.2, *)
private struct ProgressBar: View {
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        if state.isPaused {
            ProgressView(value: progressWhenPaused)
                .tint(Color(red: 1, green: 0.62, blue: 0.04))
        } else {
            ProgressView(timerInterval: startDate...max(state.endAt, Date().addingTimeInterval(1)),
                         countsDown: false)
                .tint(Color(red: 1, green: 0.62, blue: 0.04))
                .labelsHidden()
        }
    }

    private var startDate: Date {
        state.endAt.addingTimeInterval(-max(1, state.totalSeconds))
    }

    private var progressWhenPaused: Double {
        guard state.totalSeconds > 0 else { return 0 }
        return min(1, max(0, (state.totalSeconds - state.pausedRemaining) / state.totalSeconds))
    }
}

@available(iOS 16.2, *)
private struct LockScreenView: View {
    let context: ActivityViewContext<TimerActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(context.attributes.label, systemImage: "timer")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                Spacer()
                if context.state.isPaused {
                    Text("متوقف مؤقتاً")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            CountdownText(state: context.state)
                .font(.system(size: 44, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(Color(red: 1, green: 0.62, blue: 0.04))

            ProgressBar(state: context.state)
        }
        .padding(16)
    }
}
