import SwiftUI
import WidgetKit

/// نقطة الدخول لامتداد الويدجت. يُضاف إلى هدف الامتداد فقط.
@main
struct TimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.2, *) {
            TimerLiveActivity()
        }
    }
}
